-- Help System Database Migration
-- Creates all necessary tables for the comprehensive help and training system

-- Help Articles Table
CREATE TABLE help_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'published',
    view_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    unhelpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    -- Indexes for performance
    CONSTRAINT help_articles_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

-- Create indexes
CREATE INDEX idx_help_articles_slug ON help_articles(slug);
CREATE INDEX idx_help_articles_category ON help_articles(category);
CREATE INDEX idx_help_articles_status ON help_articles(status);
CREATE INDEX idx_help_articles_tags ON help_articles USING GIN(tags);
CREATE INDEX idx_help_articles_search ON help_articles USING GIN(to_tsvector('english', title || ' ' || content));

-- Tooltips Table
CREATE TABLE tooltips (
    id SERIAL PRIMARY KEY,
    element_id VARCHAR(200) NOT NULL,
    page_path VARCHAR(200) NOT NULL,
    title VARCHAR(200),
    content TEXT NOT NULL,
    position VARCHAR(20) DEFAULT 'top',
    trigger VARCHAR(20) DEFAULT 'hover',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT tooltips_position_check CHECK (position IN ('top', 'bottom', 'left', 'right')),
    CONSTRAINT tooltips_trigger_check CHECK (trigger IN ('hover', 'click', 'focus'))
);

-- Create indexes
CREATE INDEX idx_tooltips_page_path ON tooltips(page_path);
CREATE INDEX idx_tooltips_element_id ON tooltips(element_id);
CREATE INDEX idx_tooltips_active ON tooltips(is_active) WHERE is_active = true;

-- User Tutorial Progress Table
CREATE TABLE user_tutorial_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    tutorial_id VARCHAR(100) NOT NULL,
    completed_steps JSONB DEFAULT '[]',
    current_step INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'not_started',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, tutorial_id),
    CONSTRAINT tutorial_status_check CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused'))
);

-- Create indexes
CREATE INDEX idx_user_tutorial_progress_user_id ON user_tutorial_progress(user_id);
CREATE INDEX idx_user_tutorial_progress_tutorial_id ON user_tutorial_progress(tutorial_id);
CREATE INDEX idx_user_tutorial_progress_status ON user_tutorial_progress(status);

-- Help Feedback Table
CREATE TABLE help_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    article_id INTEGER REFERENCES help_articles(id),
    feedback_type VARCHAR(20) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT feedback_type_check CHECK (feedback_type IN ('helpful', 'not_helpful', 'suggestion'))
);

-- Create indexes
CREATE INDEX idx_help_feedback_article_id ON help_feedback(article_id);
CREATE INDEX idx_help_feedback_user_id ON help_feedback(user_id);
CREATE INDEX idx_help_feedback_type ON help_feedback(feedback_type);

-- Support Tickets Table
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    assigned_to INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ticket_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT ticket_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled'))
);

-- Create indexes
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- Knowledge Base Searches Table
CREATE TABLE knowledge_base_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query VARCHAR(500) NOT NULL,
    results_count INTEGER DEFAULT 0,
    clicked_result_id INTEGER REFERENCES help_articles(id),
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_knowledge_base_searches_user_id ON knowledge_base_searches(user_id);
CREATE INDEX idx_knowledge_base_searches_query ON knowledge_base_searches(query);
CREATE INDEX idx_knowledge_base_searches_created_at ON knowledge_base_searches(created_at);

-- Insert Sample Help Articles
INSERT INTO help_articles (title, slug, content, summary, category, subcategory, tags, created_by) VALUES
('Getting Started with Sentia Dashboard', 'getting-started-dashboard', 
 'Welcome to the Sentia Manufacturing Dashboard! This guide will walk you through the basic features and help you get started with managing your manufacturing operations.

## Dashboard Overview
The main dashboard provides a comprehensive view of your manufacturing operations including:
- Key performance indicators
- Real-time alerts and notifications
- Quick action buttons
- Recent activity feed

## Navigation
Use the top navigation bar to access different modules:
- **Dashboard**: Main overview and KPIs
- **Products**: Product catalog management
- **Forecasting**: Demand prediction tools
- **Inventory**: Stock optimization
- **Production**: Scheduling and planning

## Getting Help
- Click the help button (?) for contextual assistance
- Visit the Help Center for comprehensive guides
- Use the search function to find specific topics

Start by exploring the dashboard and familiarizing yourself with the navigation. The interactive tutorials will guide you through each feature step by step.',
 'Learn the basics of navigating and using the Sentia Manufacturing Dashboard',
 'getting_started', 'navigation', '["dashboard", "navigation", "basics"]', 1),

('How to Generate Your First Forecast', 'generating-first-forecast',
 'Demand forecasting is crucial for effective production planning. This guide shows you how to generate your first forecast using the Sentia Dashboard.

## Step 1: Access the Forecasting Module
Navigate to **Forecasting** in the main menu. You''ll see the forecasting dashboard with options to create new forecasts.

## Step 2: Select Products
Choose the products you want to forecast:
1. Click "Select Products"
2. Choose from your product catalog
3. You can select individual products or product groups

## Step 3: Choose Forecasting Method
Select the appropriate forecasting method:
- **Simple Moving Average**: Good for stable demand
- **Exponential Smoothing**: Better for trending data
- **Seasonal Models**: For products with seasonal patterns
- **ARIMA**: Advanced statistical model

## Step 4: Set Parameters
Configure the forecast parameters:
- **Time Horizon**: How far into the future to forecast
- **Historical Period**: How much past data to use
- **Confidence Level**: Usually 95% for business planning

## Step 5: Generate and Review
Click "Generate Forecast" and wait for the results. Review the forecast chart and accuracy metrics before accepting the forecast.',
 'Step-by-step guide to creating demand forecasts for your products',
 'forecasting', 'methods', '["forecasting", "demand", "tutorial"]', 1),

('Understanding Stock Alerts', 'understanding-stock-alerts',
 'Stock alerts help you maintain optimal inventory levels and avoid stockouts. This guide explains the different types of alerts and how to respond to them.

## Types of Stock Alerts

### Critical Stock Alert (Red)
- Inventory below reorder point
- **Action Required**: Place order immediately
- **Risk**: Potential stockout within lead time

### Low Stock Warning (Yellow)  
- Inventory approaching reorder point
- **Action Required**: Prepare purchase orders
- **Risk**: May reach reorder point soon

### Overstock Alert (Orange)
- Inventory above maximum level
- **Action Required**: Consider promotions or reduced ordering
- **Risk**: High carrying costs

### Slow Moving Alert (Blue)
- Low turnover rate detected
- **Action Required**: Review demand patterns
- **Risk**: Obsolete inventory

## Responding to Alerts

1. **Review the Alert Details**: Check current stock levels, recent sales, and lead times
2. **Verify Accuracy**: Ensure inventory counts are current
3. **Check Forecasts**: Review demand predictions
4. **Take Action**: Place orders, adjust safety stock, or investigate issues
5. **Monitor Results**: Track the effectiveness of your actions

## Customizing Alert Thresholds
You can adjust alert thresholds in the Inventory Settings:
- Reorder points
- Safety stock levels  
- Maximum inventory levels
- Slow-moving thresholds',
 'Learn about different stock alerts and how to respond to them effectively',
 'inventory', 'alerts', '["inventory", "alerts", "stock management"]', 1),

('Amazon SP-API Integration Setup', 'amazon-integration-setup',
 'Connect your Amazon Seller Central account to automatically sync orders, inventory, and sales data.

## Prerequisites
- Amazon Seller Central account
- Developer access to Amazon''s SP-API
- API credentials from Amazon Developer Console

## Step 1: Get API Credentials
1. Log into Amazon Developer Console
2. Create a new application for SP-API
3. Note your Client ID and Client Secret
4. Generate refresh token through OAuth flow

## Step 2: Configure Integration
1. Go to **Admin** > **Integrations** > **Amazon SP-API**
2. Enter your credentials:
   - Client ID
   - Client Secret  
   - Refresh Token
   - Select marketplaces (US, UK, EU)
3. Test the connection

## Step 3: Map Products
Map your Sentia product SKUs to Amazon ASINs:
1. Go to Product Mapping tab
2. Match products automatically or manually
3. Verify all products are mapped correctly

## Step 4: Configure Sync Settings
Set up synchronization preferences:
- **Sync Frequency**: Hourly, daily, or manual
- **Data Types**: Orders, inventory, returns
- **Date Range**: How far back to sync historical data

## Troubleshooting
Common issues and solutions:
- **Authentication errors**: Check credentials and refresh token
- **Rate limiting**: Reduce sync frequency
- **Missing data**: Verify marketplace and date range settings',
 'Complete guide to setting up Amazon SP-API integration for automated data sync',
 'integrations', 'amazon', '["amazon", "integration", "sp-api", "setup"]', 1);

-- Insert Sample Tooltips
INSERT INTO tooltips (element_id, page_path, title, content, position, trigger) VALUES
('dashboard-revenue-card', '/dashboard', 'Revenue Overview', 
 'This card shows your total revenue for the current month compared to the previous month. The percentage change indicates growth or decline.', 
 'top', 'hover'),
('forecast-accuracy-metric', '/forecasting', 'Forecast Accuracy',
 'MAPE (Mean Absolute Percentage Error) measures forecast accuracy. Values below 15% are considered good for business planning.',
 'right', 'hover'),
('stock-level-indicator', '/inventory', 'Stock Level Colors',
 'Green = Normal stock, Yellow = Low stock, Red = Critical stock, Blue = Overstock. Click for detailed information.',
 'bottom', 'click'),
('production-utilization', '/production', 'Resource Utilization',
 'Shows how efficiently your production resources are being used. Aim for 80-90% utilization for optimal performance.',
 'left', 'hover');

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_help_articles_updated_at BEFORE UPDATE ON help_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tooltips_updated_at BEFORE UPDATE ON tooltips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tutorial_progress_updated_at BEFORE UPDATE ON user_tutorial_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW help_articles_with_stats AS
SELECT 
    ha.*,
    COALESCE(fb.total_feedback, 0) as total_feedback,
    COALESCE(fb.helpful_percentage, 0) as helpful_percentage,
    COALESCE(searches.click_count, 0) as search_clicks
FROM help_articles ha
LEFT JOIN (
    SELECT 
        article_id,
        COUNT(*) as total_feedback,
        ROUND(
            (SUM(CASE WHEN feedback_type = 'helpful' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
            2
        ) as helpful_percentage
    FROM help_feedback
    GROUP BY article_id
) fb ON ha.id = fb.article_id
LEFT JOIN (
    SELECT 
        clicked_result_id,
        COUNT(*) as click_count
    FROM knowledge_base_searches
    WHERE clicked_result_id IS NOT NULL
    GROUP BY clicked_result_id
) searches ON ha.id = searches.clicked_result_id
WHERE ha.status = 'published';

CREATE VIEW tutorial_completion_stats AS
SELECT 
    tutorial_id,
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_users,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_users,
    ROUND(
        (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0) / COUNT(*), 
        2
    ) as completion_rate,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as avg_completion_hours
FROM user_tutorial_progress
WHERE started_at IS NOT NULL
GROUP BY tutorial_id;

CREATE VIEW support_ticket_metrics AS
SELECT 
    category,
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours,
    ROUND(
        (COUNT(CASE WHEN status = 'resolved' THEN 1 END) * 100.0) / COUNT(*), 
        2
    ) as resolution_rate
FROM support_tickets
GROUP BY category;

-- Grant permissions (adjust role names as needed)
GRANT SELECT, INSERT, UPDATE ON help_articles TO app_user;
GRANT SELECT, INSERT, UPDATE ON tooltips TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_tutorial_progress TO app_user;
GRANT SELECT, INSERT, UPDATE ON help_feedback TO app_user;
GRANT SELECT, INSERT, UPDATE ON support_tickets TO app_user;
GRANT SELECT, INSERT ON knowledge_base_searches TO app_user;

GRANT SELECT ON help_articles_with_stats TO app_user;
GRANT SELECT ON tutorial_completion_stats TO app_user;
GRANT SELECT ON support_ticket_metrics TO app_user;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Add comments for documentation
COMMENT ON TABLE help_articles IS 'Stores help articles and documentation content';
COMMENT ON TABLE tooltips IS 'Contextual help tooltips for UI elements';
COMMENT ON TABLE user_tutorial_progress IS 'Tracks user progress through interactive tutorials';
COMMENT ON TABLE help_feedback IS 'User feedback on help articles and content';
COMMENT ON TABLE support_tickets IS 'Customer support ticket system';
COMMENT ON TABLE knowledge_base_searches IS 'Search analytics for knowledge base improvement';

-- Migration complete message
SELECT 'Help system database migration completed successfully!' as status;