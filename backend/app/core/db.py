import os
import ssl
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

MONGODB_URL = os.getenv("MONGO_URI")

class DataBase:
    client: AsyncIOMotorClient = None

db = DataBase()

async def connect_to_mongo():
    if not MONGODB_URL:
        print("Error: MONGO_URI environment variable is required")
        print("Please set MONGO_URI in your .env file with your MongoDB Atlas connection string")
        return
    
    # Validate connection string format
    if not MONGODB_URL.startswith("mongodb+srv://"):
        print("Warning: Connection string should start with 'mongodb+srv://' for Atlas")
    
    # Check for common connection string issues
    if "ssl=true" in MONGODB_URL or "ssl_cert_reqs" in MONGODB_URL:
        print("Warning: SSL parameters in connection string may cause conflicts")
        print("Cleaning connection string...")
        
        # Clean the connection string by removing SSL parameters
        clean_uri = MONGODB_URL
        if "ssl=true" in clean_uri:
            clean_uri = clean_uri.replace("ssl=true", "").replace("&&", "&").replace("?&", "?")
        if "ssl_cert_reqs" in clean_uri:
            clean_uri = clean_uri.replace("ssl_cert_reqs=CERT_NONE", "").replace("&&", "&").replace("?&", "?")
        
        # Clean up any trailing ? or &
        clean_uri = clean_uri.rstrip("?&")
        print(f"Using cleaned connection string: {clean_uri[:50]}...")
        # Use clean_uri instead of reassigning MONGODB_URL
    
    try:
        # First attempt: Standard connection
        print("Attempting to connect to MongoDB Atlas...")
        # Use cleaned URI if available, otherwise use original
        connection_uri = clean_uri if 'clean_uri' in locals() else MONGODB_URL
        db.client = AsyncIOMotorClient(
            connection_uri,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            maxPoolSize=10,
            minPoolSize=1
        )
        # Test the connection
        await db.client.admin.command('ping')
        print("Successfully connected to MongoDB Atlas")
        return
    except Exception as e:
        print(f"First connection attempt failed: {e}")
        
        try:
            # Second attempt: With TLS bypass for Windows
            print("Retrying with TLS bypass configuration...")
            db.client = AsyncIOMotorClient(
                connection_uri,
                serverSelectionTimeoutMS=30000,
                connectTimeoutMS=30000,
                socketTimeoutMS=30000,
                maxPoolSize=10,
                minPoolSize=1,
                tlsAllowInvalidCertificates=True,
                tlsAllowInvalidHostnames=True
            )
            # Test the connection
            await db.client.admin.command('ping')
            print("Successfully connected to MongoDB Atlas with TLS bypass")
            return
        except Exception as e2:
            print(f"Second connection attempt failed: {e2}")
            
            try:
                # Third attempt: Try with a different connection approach
                print("Retrying with alternative connection method...")
                # Use a more compatible connection string
                alt_uri = connection_uri.replace("mongodb+srv://", "mongodb://")
                if "?" in alt_uri:
                    alt_uri += "&ssl=false"
                else:
                    alt_uri += "?ssl=false"
                
                db.client = AsyncIOMotorClient(
                    alt_uri,
                    serverSelectionTimeoutMS=30000,
                    connectTimeoutMS=30000,
                    socketTimeoutMS=30000,
                    maxPoolSize=10,
                    minPoolSize=1
                )
                # Test the connection
                await db.client.admin.command('ping')
                print("Successfully connected to MongoDB Atlas with alternative method")
                return
            except Exception as e3:
                print(f"Third connection attempt failed: {e3}")
                print("Error: Could not connect to MongoDB Atlas")
                print("This appears to be a Python 3.13 + Windows + MongoDB Atlas compatibility issue")
                print("\n🔧 Solutions to try:")
                print("1. Use Python 3.11 or 3.12 instead of 3.13")
                print("2. Check MongoDB Atlas Network Access - whitelist your IP")
                print("3. Verify cluster status in MongoDB Atlas dashboard")
                print("4. Try connecting from MongoDB Compass to test the connection string")
                print("5. Check Windows firewall and antivirus settings")
                db.client = None

async def close_mongo_connection():
    if db.client:
        db.client.close()

# Note: Create a .env file in your backend directory with:
# MONGO_URI=your_mongodb_atlas_url
# JWT_SECRET_KEY=your_secret_key 