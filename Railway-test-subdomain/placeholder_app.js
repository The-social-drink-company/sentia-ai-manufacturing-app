const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Root route - serve the SENTIA webpage
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SENTIA - Premium GABA Spirits</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            overflow-x: hidden;
        }

        /* Top Banner */
        .top-banner {
            background: #333;
            color: white;
            padding: 8px 20px;
            font-size: 13px;
            text-align: center;
            position: relative;
        }

        .close-banner {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            font-size: 18px;
        }

        .free-shipping {
            text-decoration: underline;
        }

        /* Header */
        .header {
            background: rgba(245, 245, 245, 0.95);
            backdrop-filter: blur(10px);
            padding: 15px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            letter-spacing: 2px;
        }

        .nav {
            display: flex;
            gap: 40px;
            list-style: none;
        }

        .nav a {
            text-decoration: none;
            color: #333;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 1px;
            transition: color 0.3s ease;
        }

        .nav a:hover {
            color: #d4a574;
        }

        .header-icons {
            display: flex;
            gap: 20px;
            align-items: center;
        }

        .icon {
            width: 20px;
            height: 20px;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .icon:hover {
            transform: scale(1.1);
        }

        /* Subscription Banner */
        .sub-banner {
            background: #000;
            color: white;
            text-align: center;
            padding: 15px;
            font-weight: bold;
            letter-spacing: 2px;
            font-size: 16px;
        }

        /* Main Content */
        .main-content {
            display: flex;
            min-height: 80vh;
            align-items: center;
            padding: 60px 40px;
        }

        .content-left {
            flex: 1;
            padding-right: 60px;
        }

        .main-title {
            font-size: clamp(48px, 8vw, 120px);
            font-weight: 900;
            line-height: 0.9;
            color: #333;
            margin-bottom: 40px;
            letter-spacing: -2px;
        }

        .cta-button {
            background: #333;
            color: white;
            padding: 15px 35px;
            border: none;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
        }

        .cta-button:hover {
            background: #d4a574;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(212, 165, 116, 0.3);
        }

        .content-right {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }

        .bottles-container {
            display: flex;
            gap: 30px;
            position: relative;
            z-index: 2;
        }

        .bottle {
            width: 200px;
            height: 400px;
            border-radius: 15px;
            position: relative;
            transition: transform 0.3s ease;
            cursor: pointer;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .bottle:hover {
            transform: translateY(-10px) scale(1.05);
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
        }

        .bottle-black {
            background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%);
        }

        .bottle-gold {
            background: linear-gradient(145deg, #d4a574 0%, #b8935f 100%);
        }

        .bottle-red {
            background: linear-gradient(145deg, #8b3a5a 0%, #6b2842 100%);
        }

        .bottle-label {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-weight: bold;
            font-size: 24px;
            letter-spacing: 3px;
            text-align: center;
        }

        .bottle-name {
            font-size: 14px;
            margin-top: 10px;
            letter-spacing: 1px;
        }

        /* Discount Badge */
        .discount-badge {
            position: fixed;
            bottom: 30px;
            left: 30px;
            background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
            color: #333;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(255, 179, 71, 0.4);
            animation: pulse 2s infinite;
            z-index: 1000;
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        /* Background Elements */
        .bg-element {
            position: absolute;
            background: rgba(212, 165, 116, 0.1);
            border-radius: 50%;
            z-index: 1;
        }

        .bg-element-1 {
            width: 300px;
            height: 300px;
            top: 10%;
            right: 10%;
            animation: float 6s ease-in-out infinite;
        }

        .bg-element-2 {
            width: 200px;
            height: 200px;
            bottom: 20%;
            left: 10%;
            animation: float 4s ease-in-out infinite reverse;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }

        /* Chat Widget Placeholder */
        .chat-widget {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #333;
            color: white;
            padding: 15px 20px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }

        .chat-widget:hover {
            background: #d4a574;
            transform: scale(1.05);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .main-content {
                flex-direction: column;
                text-align: center;
                padding: 40px 20px;
            }

            .content-left {
                padding-right: 0;
                margin-bottom: 40px;
            }

            .bottles-container {
                gap: 20px;
            }

            .bottle {
                width: 150px;
                height: 300px;
            }

            .nav {
                gap: 20px;
            }

            .header {
                padding: 15px 20px;
            }
        }
    </style>
</head>
<body>
    <!-- Top Banner -->
    <div class="top-banner">
        Spend £40 or more for <span class="free-shipping">Free Shipping</span> on all UK orders - Shop Now
        <span class="close-banner">×</span>
    </div>

    <!-- Header -->
    <header class="header">
        <div class="logo">SENTIA</div>
        <nav>
            <ul class="nav">
                <li><a href="#shop">SHOP</a></li>
                <li><a href="#bundles">BUNDLES</a></li>
                <li><a href="#subscriptions">SUBSCRIPTIONS</a></li>
                <li><a href="#find-us">FIND US</a></li>
                <li><a href="#news">OUR NEWS</a></li>
                <li><a href="#recipes">MOCKTAIL RECIPES</a></li>
                <li><a href="#faqs">FAQS</a></li>
            </ul>
        </nav>
        <div class="header-icons">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
        </div>
    </header>

    <!-- Subscription Banner -->
    <div class="sub-banner">
        SUBSCRIBE & SAVE UP TO 19%
    </div>

    <!-- Main Content -->
    <main class="main-content">
        <div class="bg-element bg-element-1"></div>
        <div class="bg-element bg-element-2"></div>
        
        <div class="content-left">
            <h1 class="main-title">
                UNLOCK YOUR<br>
                GABA - FIND YOUR<br>
                MOMENT
            </h1>
            <button class="cta-button">Explore GABA Spirits</button>
        </div>

        <div class="content-right">
            <div class="bottles-container">
                <div class="bottle bottle-black">
                    <div class="bottle-label">
                        SEN<br>TIA
                        <div class="bottle-name">GABA BLACK</div>
                    </div>
                </div>
                <div class="bottle bottle-gold">
                    <div class="bottle-label">
                        SEN<br>TIA
                        <div class="bottle-name">GABA GOLD</div>
                    </div>
                </div>
                <div class="bottle bottle-red">
                    <div class="bottle-label">
                        SEN<br>TIA
                        <div class="bottle-name">GABA RED</div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Discount Badge -->
    <div class="discount-badge">
        GET 10% OFF
    </div>

    <!-- Chat Widget -->
    <div class="chat-widget">
        💬 Chat
    </div>

    <script>
        // Close banner functionality
        document.querySelector('.close-banner').addEventListener('click', function() {
            document.querySelector('.top-banner').style.display = 'none';
        });

        // Add interactive hover effects
        document.querySelectorAll('.bottle').forEach(bottle => {
            bottle.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.05)';
            });
            
            bottle.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Smooth scroll for navigation
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
            });
        });

        // Discount badge click animation
        document.querySelector('.discount-badge').addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });

        // Chat widget functionality
        document.querySelector('.chat-widget').addEventListener('click', function() {
            alert('Chat functionality would open here!');
        });
    </script>
</body>
</html>
    `);
});

// Start the server
app.listen(PORT, () => {
    console.log('SENTIA webpage server running on http://localhost:' + PORT);
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nServer shutting down gracefully...');
    process.exit(0);
});