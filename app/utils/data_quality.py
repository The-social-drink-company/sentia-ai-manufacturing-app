from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from sqlalchemy import func, and_, or_
from app import db
from app.models.data_import import DataImport, ImportError, ImportType, ImportStatus
from app.models.historical_sales import HistoricalSales
from app.models.product import Product
from app.models.inventory_level import InventoryLevel

@dataclass
class DataQualityMetric:
    metric_name: str
    value: float
    unit: str
    status: str  # 'good', 'warning', 'critical'
    trend: str  # 'up', 'down', 'stable'
    description: str
    threshold_good: float = None
    threshold_warning: float = None

@dataclass
class DataQualityReport:
    report_date: datetime
    overall_score: float
    metrics: List[DataQualityMetric]
    recommendations: List[str]
    data_sources_health: Dict[str, Dict]
    import_performance: Dict[str, Any]

class DataQualityAnalyzer:
    """Analyze data quality across all imported data"""
    
    def __init__(self):
        self.metric_thresholds = {
            'completeness': {'good': 95.0, 'warning': 85.0},
            'accuracy': {'good': 95.0, 'warning': 90.0},
            'consistency': {'good': 98.0, 'warning': 95.0},
            'timeliness': {'good': 90.0, 'warning': 80.0},
            'validity': {'good': 98.0, 'warning': 95.0}
        }
    
    def generate_quality_report(self, days_back: int = 30) -> DataQualityReport:
        """Generate comprehensive data quality report"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days_back)
        
        # Calculate various quality metrics
        metrics = []
        
        # Import success rate
        import_metrics = self._analyze_import_performance(start_date, end_date)
        metrics.extend(import_metrics)
        
        # Data completeness
        completeness_metrics = self._analyze_data_completeness()
        metrics.extend(completeness_metrics)
        
        # Data accuracy
        accuracy_metrics = self._analyze_data_accuracy(start_date, end_date)
        metrics.extend(accuracy_metrics)
        
        # Data consistency
        consistency_metrics = self._analyze_data_consistency()
        metrics.extend(consistency_metrics)
        
        # Data timeliness
        timeliness_metrics = self._analyze_data_timeliness(start_date, end_date)
        metrics.extend(timeliness_metrics)
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(metrics)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(metrics)
        
        # Analyze data source health
        data_sources_health = self._analyze_data_source_health(start_date, end_date)
        
        # Import performance summary
        import_performance = self._get_import_performance_summary(start_date, end_date)
        
        return DataQualityReport(
            report_date=end_date,
            overall_score=overall_score,
            metrics=metrics,
            recommendations=recommendations,
            data_sources_health=data_sources_health,
            import_performance=import_performance
        )
    
    def _analyze_import_performance(self, start_date: datetime, end_date: datetime) -> List[DataQualityMetric]:
        """Analyze import success rates and performance"""
        # Total imports in period
        total_imports = DataImport.query.filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date
            )
        ).count()
        
        if total_imports == 0:
            return []
        
        # Successful imports
        successful_imports = DataImport.query.filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date,
                DataImport.status == ImportStatus.COMPLETED
            )
        ).count()
        
        # Failed imports
        failed_imports = DataImport.query.filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date,
                DataImport.status == ImportStatus.FAILED
            )
        ).count()
        
        # Calculate success rate
        success_rate = (successful_imports / total_imports) * 100
        failure_rate = (failed_imports / total_imports) * 100
        
        # Determine status and trend
        success_status = self._get_metric_status(success_rate, 'import_success')
        failure_status = self._get_metric_status(failure_rate, 'import_failure', inverse=True)
        
        metrics = [
            DataQualityMetric(
                metric_name="Import Success Rate",
                value=success_rate,
                unit="%",
                status=success_status,
                trend="stable",  # Would need historical data for trend
                description="Percentage of imports completed successfully",
                threshold_good=95.0,
                threshold_warning=85.0
            ),
            DataQualityMetric(
                metric_name="Import Failure Rate",
                value=failure_rate,
                unit="%",
                status=failure_status,
                trend="stable",
                description="Percentage of imports that failed",
                threshold_good=5.0,
                threshold_warning=15.0
            )
        ]
        
        return metrics
    
    def _analyze_data_completeness(self) -> List[DataQualityMetric]:
        """Analyze completeness of data across different tables"""
        metrics = []
        
        # Product data completeness
        total_products = Product.query.filter_by(is_active=True).count()
        if total_products > 0:
            # Count products with complete essential information
            complete_products = Product.query.filter(
                and_(
                    Product.is_active == True,
                    Product.sku.isnot(None),
                    Product.name.isnot(None),
                    Product.category.isnot(None),
                    Product.market_region.isnot(None),
                    Product.unit_cost.isnot(None),
                    Product.selling_price.isnot(None)
                )
            ).count()
            
            completeness_rate = (complete_products / total_products) * 100
            status = self._get_metric_status(completeness_rate, 'completeness')
            
            metrics.append(DataQualityMetric(
                metric_name="Product Data Completeness",
                value=completeness_rate,
                unit="%",
                status=status,
                trend="stable",
                description="Percentage of products with complete essential information"
            ))
        
        # Sales data completeness
        total_sales = HistoricalSales.query.count()
        if total_sales > 0:
            complete_sales = HistoricalSales.query.filter(
                and_(
                    HistoricalSales.product_id.isnot(None),
                    HistoricalSales.sales_channel_id.isnot(None),
                    HistoricalSales.sale_date.isnot(None),
                    HistoricalSales.quantity_sold.isnot(None),
                    HistoricalSales.unit_price.isnot(None),
                    HistoricalSales.gross_revenue.isnot(None)
                )
            ).count()
            
            completeness_rate = (complete_sales / total_sales) * 100
            status = self._get_metric_status(completeness_rate, 'completeness')
            
            metrics.append(DataQualityMetric(
                metric_name="Sales Data Completeness",
                value=completeness_rate,
                unit="%",
                status=status,
                trend="stable",
                description="Percentage of sales records with complete essential information"
            ))
        
        return metrics
    
    def _analyze_data_accuracy(self, start_date: datetime, end_date: datetime) -> List[DataQualityMetric]:
        """Analyze data accuracy based on validation results"""
        metrics = []
        
        # Get validation errors in the period
        total_errors = ImportError.query.join(DataImport).filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date,
                ImportError.error_severity == 'error'
            )
        ).count()
        
        # Get total rows processed
        total_rows_result = db.session.query(
            func.sum(DataImport.successful_rows + DataImport.failed_rows)
        ).filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date,
                DataImport.status == ImportStatus.COMPLETED
            )
        ).scalar()
        
        total_rows = total_rows_result or 0
        
        if total_rows > 0:
            accuracy_rate = ((total_rows - total_errors) / total_rows) * 100
            status = self._get_metric_status(accuracy_rate, 'accuracy')
            
            metrics.append(DataQualityMetric(
                metric_name="Data Accuracy Rate",
                value=accuracy_rate,
                unit="%",
                status=status,
                trend="stable",
                description="Percentage of imported data without validation errors"
            ))
        
        # Business rule compliance
        business_rule_errors = ImportError.query.join(DataImport).filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date,
                ImportError.error_type == 'business_rule'
            )
        ).count()
        
        if total_rows > 0:
            compliance_rate = ((total_rows - business_rule_errors) / total_rows) * 100
            status = self._get_metric_status(compliance_rate, 'validity')
            
            metrics.append(DataQualityMetric(
                metric_name="Business Rule Compliance",
                value=compliance_rate,
                unit="%",
                status=status,
                trend="stable",
                description="Percentage of data complying with business rules"
            ))
        
        return metrics
    
    def _analyze_data_consistency(self) -> List[DataQualityMetric]:
        """Analyze data consistency across related tables"""
        metrics = []
        
        # Check for orphaned sales records (sales without valid products)
        total_sales = HistoricalSales.query.count()
        if total_sales > 0:
            orphaned_sales = HistoricalSales.query.filter(
                ~HistoricalSales.product_id.in_(
                    db.session.query(Product.id).filter(Product.is_active == True)
                )
            ).count()
            
            consistency_rate = ((total_sales - orphaned_sales) / total_sales) * 100
            status = self._get_metric_status(consistency_rate, 'consistency')
            
            metrics.append(DataQualityMetric(
                metric_name="Sales-Product Consistency",
                value=consistency_rate,
                unit="%",
                status=status,
                trend="stable",
                description="Percentage of sales records with valid product references"
            ))
        
        # Revenue calculation consistency
        inconsistent_revenue = HistoricalSales.query.filter(
            func.abs(HistoricalSales.gross_revenue - 
                    (HistoricalSales.quantity_sold * HistoricalSales.unit_price)) > 0.01
        ).count()
        
        if total_sales > 0:
            revenue_consistency = ((total_sales - inconsistent_revenue) / total_sales) * 100
            status = self._get_metric_status(revenue_consistency, 'consistency')
            
            metrics.append(DataQualityMetric(
                metric_name="Revenue Calculation Consistency",
                value=revenue_consistency,
                unit="%",
                status=status,
                trend="stable",
                description="Percentage of sales with accurate revenue calculations"
            ))
        
        return metrics
    
    def _analyze_data_timeliness(self, start_date: datetime, end_date: datetime) -> List[DataQualityMetric]:
        """Analyze timeliness of data imports"""
        metrics = []
        
        # Recent data availability (sales data from last 7 days)
        recent_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        
        recent_sales = HistoricalSales.query.filter(
            HistoricalSales.sale_date >= recent_cutoff.date()
        ).count()
        
        # Expected recent sales (rough estimate based on historical average)
        historical_avg = HistoricalSales.query.filter(
            HistoricalSales.sale_date >= (recent_cutoff - timedelta(days=30)).date()
        ).count() / 30  # Daily average
        
        expected_recent = historical_avg * 7
        
        if expected_recent > 0:
            timeliness_rate = min((recent_sales / expected_recent) * 100, 100)
            status = self._get_metric_status(timeliness_rate, 'timeliness')
            
            metrics.append(DataQualityMetric(
                metric_name="Data Timeliness",
                value=timeliness_rate,
                unit="%",
                status=status,
                trend="stable",
                description="Availability of recent data compared to historical patterns"
            ))
        
        # Import processing time
        avg_processing_time = db.session.query(
            func.avg(DataImport.processing_duration_seconds)
        ).filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date,
                DataImport.status == ImportStatus.COMPLETED,
                DataImport.processing_duration_seconds.isnot(None)
            )
        ).scalar()
        
        if avg_processing_time:
            # Convert to minutes
            avg_processing_minutes = avg_processing_time / 60
            
            # Status based on processing time (arbitrary thresholds)
            if avg_processing_minutes <= 5:
                status = "good"
            elif avg_processing_minutes <= 15:
                status = "warning"
            else:
                status = "critical"
            
            metrics.append(DataQualityMetric(
                metric_name="Average Import Processing Time",
                value=avg_processing_minutes,
                unit="minutes",
                status=status,
                trend="stable",
                description="Average time to process data imports"
            ))
        
        return metrics
    
    def _analyze_data_source_health(self, start_date: datetime, end_date: datetime) -> Dict[str, Dict]:
        """Analyze health of different data sources"""
        health_summary = {}
        
        for import_type in ImportType:
            # Get imports for this type
            type_imports = DataImport.query.filter(
                and_(
                    DataImport.import_type == import_type,
                    DataImport.created_at >= start_date,
                    DataImport.created_at <= end_date
                )
            ).all()
            
            if not type_imports:
                continue
            
            total = len(type_imports)
            successful = len([i for i in type_imports if i.status == ImportStatus.COMPLETED])
            failed = len([i for i in type_imports if i.status == ImportStatus.FAILED])
            
            avg_quality_score = sum([i.data_quality_score or 0 for i in type_imports]) / total
            
            success_rate = (successful / total) * 100 if total > 0 else 0
            
            health_summary[import_type.value] = {
                'total_imports': total,
                'successful_imports': successful,
                'failed_imports': failed,
                'success_rate': success_rate,
                'average_quality_score': avg_quality_score,
                'status': 'good' if success_rate >= 95 else 'warning' if success_rate >= 85 else 'critical'
            }
        
        return health_summary
    
    def _get_import_performance_summary(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get import performance summary"""
        # Total volume metrics
        total_imports = DataImport.query.filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date
            )
        ).count()
        
        total_rows_processed = db.session.query(
            func.sum(DataImport.successful_rows + DataImport.failed_rows)
        ).filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date
            )
        ).scalar() or 0
        
        avg_import_size = db.session.query(
            func.avg(DataImport.total_rows)
        ).filter(
            and_(
                DataImport.created_at >= start_date,
                DataImport.created_at <= end_date,
                DataImport.total_rows.isnot(None)
            )
        ).scalar() or 0
        
        return {
            'period_days': (end_date - start_date).days,
            'total_imports': total_imports,
            'total_rows_processed': total_rows_processed,
            'average_import_size': avg_import_size,
            'imports_per_day': total_imports / max((end_date - start_date).days, 1),
            'rows_per_day': total_rows_processed / max((end_date - start_date).days, 1)
        }
    
    def _get_metric_status(self, value: float, metric_type: str, inverse: bool = False) -> str:
        """Determine status based on value and thresholds"""
        thresholds = self.metric_thresholds.get(metric_type, {'good': 95.0, 'warning': 85.0})
        
        if inverse:
            # For metrics where lower is better (like failure rate)
            if value <= thresholds['good']:
                return "good"
            elif value <= thresholds['warning']:
                return "warning"
            else:
                return "critical"
        else:
            # For metrics where higher is better
            if value >= thresholds['good']:
                return "good"
            elif value >= thresholds['warning']:
                return "warning"
            else:
                return "critical"
    
    def _calculate_overall_score(self, metrics: List[DataQualityMetric]) -> float:
        """Calculate overall data quality score"""
        if not metrics:
            return 0.0
        
        # Weight different metric types
        weights = {
            'completeness': 0.25,
            'accuracy': 0.30,
            'consistency': 0.25,
            'timeliness': 0.15,
            'validity': 0.05
        }
        
        weighted_scores = []
        
        for metric in metrics:
            # Determine metric category from name
            category = 'accuracy'  # default
            if 'completeness' in metric.metric_name.lower():
                category = 'completeness'
            elif 'consistency' in metric.metric_name.lower():
                category = 'consistency'
            elif 'timeliness' in metric.metric_name.lower():
                category = 'timeliness'
            elif 'compliance' in metric.metric_name.lower():
                category = 'validity'
            
            weight = weights.get(category, 0.1)
            
            # Convert percentage metrics to 0-1 scale
            score = metric.value / 100 if metric.unit == '%' else min(metric.value / 100, 1.0)
            
            weighted_scores.append(score * weight)
        
        return sum(weighted_scores) / len(weighted_scores) * 100 if weighted_scores else 0.0
    
    def _generate_recommendations(self, metrics: List[DataQualityMetric]) -> List[str]:
        """Generate recommendations based on metrics"""
        recommendations = []
        
        for metric in metrics:
            if metric.status == 'critical':
                if 'Import Success Rate' in metric.metric_name:
                    recommendations.append(
                        "Import success rate is critically low. Review import templates and validation rules."
                    )
                elif 'Completeness' in metric.metric_name:
                    recommendations.append(
                        f"Data completeness for {metric.metric_name.lower()} needs immediate attention. "
                        "Consider updating import templates to make essential fields required."
                    )
                elif 'Accuracy' in metric.metric_name:
                    recommendations.append(
                        "Data accuracy is below acceptable levels. Review validation rules and provide "
                        "better guidance to data providers."
                    )
                elif 'Consistency' in metric.metric_name:
                    recommendations.append(
                        "Data consistency issues detected. Implement cross-reference validation checks."
                    )
            
            elif metric.status == 'warning':
                if 'Processing Time' in metric.metric_name:
                    recommendations.append(
                        "Import processing times are increasing. Consider optimizing the import pipeline."
                    )
                elif 'Timeliness' in metric.metric_name:
                    recommendations.append(
                        "Data timeliness could be improved. Set up automated import schedules or alerts."
                    )
        
        # Add general recommendations
        if not any('template' in rec.lower() for rec in recommendations):
            recommendations.append(
                "Regularly update import templates and provide training to data providers."
            )
        
        recommendations.append(
            "Monitor data quality metrics weekly and address issues promptly."
        )
        
        return recommendations[:10]  # Limit to top 10 recommendations

class DataQualityReportGenerator:
    """Generate formatted data quality reports"""
    
    def __init__(self, analyzer: DataQualityAnalyzer):
        self.analyzer = analyzer
    
    def generate_html_report(self, report: DataQualityReport) -> str:
        """Generate HTML formatted report"""
        html = f"""
        <div class="data-quality-report">
            <div class="report-header">
                <h2>Data Quality Report</h2>
                <p>Generated on {report.report_date.strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
                <div class="overall-score score-{self._get_score_class(report.overall_score)}">
                    Overall Score: {report.overall_score:.1f}/100
                </div>
            </div>
            
            <div class="metrics-section">
                <h3>Quality Metrics</h3>
                <div class="metrics-grid">
                    {self._generate_metrics_html(report.metrics)}
                </div>
            </div>
            
            <div class="recommendations-section">
                <h3>Recommendations</h3>
                <ul>
                    {''.join([f'<li>{rec}</li>' for rec in report.recommendations])}
                </ul>
            </div>
            
            <div class="data-sources-section">
                <h3>Data Source Health</h3>
                {self._generate_data_sources_html(report.data_sources_health)}
            </div>
            
            <div class="performance-section">
                <h3>Import Performance</h3>
                {self._generate_performance_html(report.import_performance)}
            </div>
        </div>
        """
        
        return html
    
    def _generate_metrics_html(self, metrics: List[DataQualityMetric]) -> str:
        """Generate HTML for metrics"""
        html = ""
        for metric in metrics:
            html += f"""
            <div class="metric-card status-{metric.status}">
                <div class="metric-name">{metric.metric_name}</div>
                <div class="metric-value">{metric.value:.1f}{metric.unit}</div>
                <div class="metric-description">{metric.description}</div>
                <div class="metric-status">{metric.status.title()}</div>
            </div>
            """
        return html
    
    def _generate_data_sources_html(self, data_sources: Dict[str, Dict]) -> str:
        """Generate HTML for data sources"""
        html = "<div class='data-sources-grid'>"
        for source, data in data_sources.items():
            html += f"""
            <div class="source-card status-{data['status']}">
                <div class="source-name">{source.title()}</div>
                <div class="source-metrics">
                    <div>Success Rate: {data['success_rate']:.1f}%</div>
                    <div>Total Imports: {data['total_imports']}</div>
                    <div>Quality Score: {data['average_quality_score']:.1f}</div>
                </div>
            </div>
            """
        html += "</div>"
        return html
    
    def _generate_performance_html(self, performance: Dict[str, Any]) -> str:
        """Generate HTML for performance metrics"""
        return f"""
        <div class="performance-metrics">
            <div>Period: {performance['period_days']} days</div>
            <div>Total Imports: {performance['total_imports']}</div>
            <div>Total Rows: {performance['total_rows_processed']:,}</div>
            <div>Average Import Size: {performance['average_import_size']:.0f} rows</div>
            <div>Imports per Day: {performance['imports_per_day']:.1f}</div>
        </div>
        """
    
    def _get_score_class(self, score: float) -> str:
        """Get CSS class for score"""
        if score >= 90:
            return "excellent"
        elif score >= 80:
            return "good"
        elif score >= 70:
            return "warning"
        else:
            return "critical"