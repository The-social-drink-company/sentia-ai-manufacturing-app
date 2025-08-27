import json
import logging
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from urllib.parse import urlencode
import requests
from flask import current_app
from app import db
from app.models.api_integration import IntegrationSyncLog
from app.models.working_capital import WorkingCapital
from app.services.api_integration_service import BaseApiClient

logger = logging.getLogger(__name__)

class XeroApiClient(BaseApiClient):
    """Xero Accounting API client"""
    
    BASE_URL = "https://api.xero.com/api.xro/2.0"
    TOKEN_URL = "https://identity.xero.com/connect/token"
    
    def _get_base_url(self) -> str:
        return self.BASE_URL
    
    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        headers.update({
            'Authorization': f'Bearer {self._get_access_token()}',
            'Xero-tenant-id': self.credential.config_json.get('tenant_id') if self.credential.config_json else None,
            'Accept': 'application/json'
        })
        return headers
    
    def _get_access_token(self) -> str:
        """Get or refresh the Xero access token"""
        if not self.credential.access_token or self.credential.needs_refresh():
            self._refresh_access_token()
        return self.credential.access_token
    
    def _refresh_access_token(self):
        """Refresh the Xero access token using OAuth 2.0"""
        if not self.credential.refresh_token:
            raise ValueError("No refresh token available for Xero integration")
        
        # Prepare basic auth header
        auth_string = f"{self.credential.client_id}:{self.credential.client_secret}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            'Authorization': f'Basic {auth_bytes}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': self.credential.refresh_token
        }
        
        response = self.session.post(self.TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        
        self.credential.access_token = token_data['access_token']
        self.credential.refresh_token = token_data.get('refresh_token', self.credential.refresh_token)
        
        if 'expires_in' in token_data:
            expires_in = int(token_data['expires_in'])
            self.credential.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        db.session.commit()
    
    def _test_endpoint(self):
        """Test connection using organisation info endpoint"""
        return self._make_request('GET', 'Organisation')
    
    def sync_data(self, sync_type: str = 'incremental') -> IntegrationSyncLog:
        """Sync data from Xero"""
        sync_log = IntegrationSyncLog(
            integration_id=self.integration.id,
            sync_type=sync_type,
            started_at=datetime.utcnow()
        )
        db.session.add(sync_log)
        db.session.flush()
        
        try:
            total_records = 0
            success_records = 0
            failed_records = 0
            
            # Sync accounts
            if self.integration.config_json.get('sync_accounts', True):
                account_stats = self._sync_accounts(sync_type)
                total_records += account_stats['total']
                success_records += account_stats['success']
                failed_records += account_stats['failed']
            
            # Sync invoices
            if self.integration.config_json.get('sync_invoices', True):
                invoice_stats = self._sync_invoices(sync_type)
                total_records += invoice_stats['total']
                success_records += invoice_stats['success']
                failed_records += invoice_stats['failed']
            
            # Sync payments
            if self.integration.config_json.get('sync_payments', True):
                payment_stats = self._sync_payments(sync_type)
                total_records += payment_stats['total']
                success_records += payment_stats['success']
                failed_records += payment_stats['failed']
            
            # Sync bank transactions
            if self.integration.config_json.get('sync_bank_transactions', True):
                bank_stats = self._sync_bank_transactions(sync_type)
                total_records += bank_stats['total']
                success_records += bank_stats['success']
                failed_records += bank_stats['failed']
            
            # Sync budget vs actual data
            if self.integration.config_json.get('sync_budgets', True):
                budget_stats = self._sync_budgets(sync_type)
                total_records += budget_stats['total']
                success_records += budget_stats['success']
                failed_records += budget_stats['failed']
            
            # Update sync log
            sync_log.completed_at = datetime.utcnow()
            sync_log.status = 'completed' if failed_records == 0 else 'partial'
            sync_log.records_processed = total_records
            sync_log.records_success = success_records
            sync_log.records_failed = failed_records
            
        except Exception as e:
            sync_log.completed_at = datetime.utcnow()
            sync_log.status = 'failed'
            sync_log.error_message = str(e)[:500]
            logger.error(f"Xero sync failed: {str(e)}")
            raise
        
        db.session.commit()
        return sync_log
    
    def _sync_accounts(self, sync_type: str) -> Dict[str, int]:
        """Sync chart of accounts from Xero"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            params = {}
            if sync_type == 'incremental' and self.integration.last_sync_at:
                modified_since = self.integration.last_sync_at.strftime('%Y-%m-%dT%H:%M:%S')
                params['ModifiedSince'] = modified_since
            
            response = self._make_request('GET', 'Accounts', params=params)
            data = response.json()
            
            accounts = data.get('Accounts', [])
            
            for account in accounts:
                try:
                    self._process_account(account)
                    stats['success'] += 1
                except Exception as e:
                    logger.error(f"Failed to process account {account.get('AccountID')}: {str(e)}")
                    stats['failed'] += 1
                
                stats['total'] += 1
                
        except Exception as e:
            logger.error(f"Failed to sync Xero accounts: {str(e)}")
            raise
        
        return stats
    
    def _process_account(self, account_data: Dict[str, Any]):
        """Process a single account from Xero"""
        # For now, we'll just log the account data
        # In a full implementation, you'd create Account models
        logger.info(f"Processing Xero account: {account_data.get('Name')} ({account_data.get('Code')})")
    
    def _sync_invoices(self, sync_type: str) -> Dict[str, int]:
        """Sync invoices from Xero"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            # Sync both ACCREC (sales) and ACCPAY (purchase) invoices
            for invoice_type in ['ACCREC', 'ACCPAY']:
                type_stats = self._sync_invoices_by_type(invoice_type, sync_type)
                stats['total'] += type_stats['total']
                stats['success'] += type_stats['success']
                stats['failed'] += type_stats['failed']
                
        except Exception as e:
            logger.error(f"Failed to sync Xero invoices: {str(e)}")
            raise
        
        return stats
    
    def _sync_invoices_by_type(self, invoice_type: str, sync_type: str) -> Dict[str, int]:
        """Sync invoices of a specific type"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        params = {
            'where': f'Type=="{invoice_type}"',
            'order': 'UpdatedDateUTC DESC'
        }
        
        if sync_type == 'incremental' and self.integration.last_sync_at:
            modified_since = self.integration.last_sync_at.strftime('%Y-%m-%dT%H:%M:%S')
            params['ModifiedSince'] = modified_since
        
        page = 1
        while True:
            params['page'] = page
            
            response = self._make_request('GET', 'Invoices', params=params)
            data = response.json()
            
            invoices = data.get('Invoices', [])
            if not invoices:
                break
            
            for invoice in invoices:
                try:
                    self._process_invoice(invoice)
                    stats['success'] += 1
                except Exception as e:
                    logger.error(f"Failed to process invoice {invoice.get('InvoiceID')}: {str(e)}")
                    stats['failed'] += 1
                
                stats['total'] += 1
            
            # Check if there are more pages
            if len(invoices) < 100:  # Xero default page size
                break
            
            page += 1
        
        return stats
    
    def _process_invoice(self, invoice_data: Dict[str, Any]):
        """Process a single invoice from Xero"""
        # Create or update working capital record
        invoice_id = invoice_data.get('InvoiceID')
        invoice_type = invoice_data.get('Type')
        
        working_capital = WorkingCapital.query.filter_by(
            external_id=invoice_id,
            external_source='xero'
        ).first()
        
        if not working_capital:
            working_capital = WorkingCapital(
                external_id=invoice_id,
                external_source='xero'
            )
            db.session.add(working_capital)
        
        # Update working capital fields
        working_capital.transaction_type = 'receivable' if invoice_type == 'ACCREC' else 'payable'
        working_capital.amount = float(invoice_data.get('Total', 0))
        working_capital.currency = invoice_data.get('CurrencyCode', 'USD')
        working_capital.status = invoice_data.get('Status', '').lower()
        
        # Parse dates
        invoice_date_str = invoice_data.get('Date')
        if invoice_date_str:
            working_capital.transaction_date = datetime.strptime(invoice_date_str, '%Y-%m-%d')
        
        due_date_str = invoice_data.get('DueDateString')
        if due_date_str:
            working_capital.due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
        
        # Store additional data
        working_capital.description = invoice_data.get('Reference', '')
        working_capital.external_data = invoice_data
        working_capital.updated_at = datetime.utcnow()
    
    def _sync_payments(self, sync_type: str) -> Dict[str, int]:
        """Sync payments from Xero"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            params = {}
            if sync_type == 'incremental' and self.integration.last_sync_at:
                modified_since = self.integration.last_sync_at.strftime('%Y-%m-%dT%H:%M:%S')
                params['ModifiedSince'] = modified_since
            
            page = 1
            while True:
                params['page'] = page
                
                response = self._make_request('GET', 'Payments', params=params)
                data = response.json()
                
                payments = data.get('Payments', [])
                if not payments:
                    break
                
                for payment in payments:
                    try:
                        self._process_payment(payment)
                        stats['success'] += 1
                    except Exception as e:
                        logger.error(f"Failed to process payment {payment.get('PaymentID')}: {str(e)}")
                        stats['failed'] += 1
                    
                    stats['total'] += 1
                
                if len(payments) < 100:
                    break
                
                page += 1
                
        except Exception as e:
            logger.error(f"Failed to sync Xero payments: {str(e)}")
            raise
        
        return stats
    
    def _process_payment(self, payment_data: Dict[str, Any]):
        """Process a single payment from Xero"""
        payment_id = payment_data.get('PaymentID')
        
        # Find related invoice if available
        invoice_data = payment_data.get('Invoice', {})
        invoice_id = invoice_data.get('InvoiceID')
        
        if invoice_id:
            # Update the related working capital record
            working_capital = WorkingCapital.query.filter_by(
                external_id=invoice_id,
                external_source='xero'
            ).first()
            
            if working_capital:
                # Update payment status
                working_capital.status = 'paid'
                working_capital.amount_paid = float(payment_data.get('Amount', 0))
                
                payment_date_str = payment_data.get('Date')
                if payment_date_str:
                    working_capital.payment_date = datetime.strptime(payment_date_str, '%Y-%m-%d')
    
    def _sync_bank_transactions(self, sync_type: str) -> Dict[str, int]:
        """Sync bank transactions from Xero"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            # First get all bank accounts
            accounts_response = self._make_request('GET', 'Accounts', params={'where': 'Type=="BANK"'})
            accounts_data = accounts_response.json()
            bank_accounts = accounts_data.get('Accounts', [])
            
            for bank_account in bank_accounts:
                account_id = bank_account.get('AccountID')
                
                params = {
                    'where': f'BankAccount.AccountID==Guid("{account_id}")',
                    'order': 'UpdatedDateUTC DESC'
                }
                
                if sync_type == 'incremental' and self.integration.last_sync_at:
                    modified_since = self.integration.last_sync_at.strftime('%Y-%m-%dT%H:%M:%S')
                    params['ModifiedSince'] = modified_since
                
                page = 1
                while True:
                    params['page'] = page
                    
                    response = self._make_request('GET', 'BankTransactions', params=params)
                    data = response.json()
                    
                    transactions = data.get('BankTransactions', [])
                    if not transactions:
                        break
                    
                    for transaction in transactions:
                        try:
                            self._process_bank_transaction(transaction)
                            stats['success'] += 1
                        except Exception as e:
                            logger.error(f"Failed to process bank transaction {transaction.get('BankTransactionID')}: {str(e)}")
                            stats['failed'] += 1
                        
                        stats['total'] += 1
                    
                    if len(transactions) < 100:
                        break
                    
                    page += 1
                    
        except Exception as e:
            logger.error(f"Failed to sync Xero bank transactions: {str(e)}")
            raise
        
        return stats
    
    def _process_bank_transaction(self, transaction_data: Dict[str, Any]):
        """Process a single bank transaction from Xero"""
        transaction_id = transaction_data.get('BankTransactionID')
        transaction_type = transaction_data.get('Type')  # RECEIVE or SPEND
        
        # Create working capital record for cash flow tracking
        working_capital = WorkingCapital.query.filter_by(
            external_id=f"bank_{transaction_id}",
            external_source='xero'
        ).first()
        
        if not working_capital:
            working_capital = WorkingCapital(
                external_id=f"bank_{transaction_id}",
                external_source='xero'
            )
            db.session.add(working_capital)
        
        working_capital.transaction_type = 'cash_inflow' if transaction_type == 'RECEIVE' else 'cash_outflow'
        working_capital.amount = float(transaction_data.get('Total', 0))
        working_capital.currency = transaction_data.get('CurrencyCode', 'USD')
        working_capital.status = 'completed'
        
        # Parse transaction date
        transaction_date_str = transaction_data.get('Date')
        if transaction_date_str:
            working_capital.transaction_date = datetime.strptime(transaction_date_str, '%Y-%m-%d')
            working_capital.payment_date = working_capital.transaction_date
        
        working_capital.description = transaction_data.get('Reference', '')
        working_capital.external_data = transaction_data
        working_capital.updated_at = datetime.utcnow()
    
    def _sync_budgets(self, sync_type: str) -> Dict[str, int]:
        """Sync budget data from Xero"""
        stats = {'total': 0, 'success': 0, 'failed': 0}
        
        try:
            # Xero doesn't have a dedicated budgets API in the core accounting API
            # This would typically be done through reports or custom fields
            # For now, we'll use the budget vs actual report
            
            current_date = datetime.utcnow()
            params = {
                'fromDate': current_date.replace(day=1).strftime('%Y-%m-%d'),  # First day of current month
                'toDate': current_date.strftime('%Y-%m-%d')
            }
            
            response = self._make_request('GET', 'Reports/BudgetSummary', params=params)
            data = response.json()
            
            # Process budget vs actual data
            reports = data.get('Reports', [])
            for report in reports:
                try:
                    self._process_budget_report(report)
                    stats['success'] += 1
                except Exception as e:
                    logger.error(f"Failed to process budget report: {str(e)}")
                    stats['failed'] += 1
                
                stats['total'] += 1
                
        except Exception as e:
            logger.error(f"Failed to sync Xero budgets: {str(e)}")
            # Budget sync is optional, so don't raise the exception
            logger.warning("Continuing without budget data")
        
        return stats
    
    def _process_budget_report(self, report_data: Dict[str, Any]):
        """Process budget vs actual report data"""
        # This would involve parsing the budget report structure
        # and creating budget vs actual records
        logger.info("Processing Xero budget vs actual report")

class XeroWebhookProcessor:
    """Process Xero webhook events"""
    
    @staticmethod
    def verify_webhook(payload: bytes, signature: str, webhook_key: str) -> bool:
        """Verify Xero webhook signature"""
        import hmac
        import hashlib
        
        calculated_signature = base64.b64encode(
            hmac.new(
                webhook_key.encode('utf-8'),
                payload,
                hashlib.sha256
            ).digest()
        ).decode()
        
        return hmac.compare_digest(calculated_signature, signature)
    
    def process_webhook(self, event_type: str, payload: Dict[str, Any]):
        """Process webhook event based on type"""
        try:
            events = payload.get('events', [])
            
            for event in events:
                resource_type = event.get('resourceType')
                event_category = event.get('eventCategory')
                
                if resource_type == 'INVOICE':
                    if event_category in ['CREATE', 'UPDATE']:
                        self._process_invoice_webhook(event)
                elif resource_type == 'PAYMENT':
                    if event_category in ['CREATE', 'UPDATE']:
                        self._process_payment_webhook(event)
                elif resource_type == 'BANKTRANSACTION':
                    if event_category in ['CREATE', 'UPDATE']:
                        self._process_bank_transaction_webhook(event)
                else:
                    logger.info(f"Unhandled Xero webhook resource type: {resource_type}")
        
        except Exception as e:
            logger.error(f"Failed to process Xero webhook: {str(e)}")
            raise
    
    def _process_invoice_webhook(self, event: Dict[str, Any]):
        """Process invoice webhook event"""
        # This would trigger a specific invoice sync
        logger.info(f"Processing Xero invoice webhook: {event.get('resourceId')}")
    
    def _process_payment_webhook(self, event: Dict[str, Any]):
        """Process payment webhook event"""
        # This would trigger a specific payment sync
        logger.info(f"Processing Xero payment webhook: {event.get('resourceId')}")
    
    def _process_bank_transaction_webhook(self, event: Dict[str, Any]):
        """Process bank transaction webhook event"""
        # This would trigger a specific bank transaction sync
        logger.info(f"Processing Xero bank transaction webhook: {event.get('resourceId')}")