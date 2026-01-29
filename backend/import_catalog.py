import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://127.0.0.1:27017')
db_name = os.environ.get('DB_NAME', 'carwash_db')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Catalog data from WhatsApp (extracted from image)
catalog_services = [
    {
        "name": "Nano Ceramic Coating Gold",
        "description": "Nano ceramic coating premium dengan proteksi maksimal. Harga asli ~Rp. 6.050.000",
        "price": 3025000,
        "duration_minutes": 240,
        "category": "coating",
        "commission_rate": 5.0,
        "image_url": "https://via.placeholder.com/300x200.png?text=Nano+Ceramic+Gold",
        "is_active": True
    },
    {
        "name": "Ultimate Premium Wash",
        "description": "Cuci Premium menggunakan; - Shampoo Premium - Semir Ban - Vacum - Lap Interior/Dashboard - Dan Lainnya",
        "price": 160000,
        "duration_minutes": 45,
        "category": "exterior",
        "commission_rate": 10.0,
        "image_url": "https://via.placeholder.com/300x200.png?text=Ultimate+Premium+Wash",
        "is_active": True
    },
    {
        "name": "Lamp Polish + Coating 1 step",
        "description": "Proses membersihkan dan merawat lampu, mengkilapkan dan Coating 1 step",
        "price": 400000,
        "duration_minutes": 60,
        "category": "detailing",
        "commission_rate": 8.0,
        "image_url": "https://via.placeholder.com/300x200.png?text=Lamp+Polish+Coating",
        "is_active": True
    },
    {
        "name": "Engine Cleaning",
        "description": "Proses menghilangkan kotoran, kerak, dan segala macam noda di mesin",
        "price": 350000,
        "duration_minutes": 90,
        "category": "detailing",
        "commission_rate": 8.0,
        "image_url": "https://via.placeholder.com/300x200.png?text=Engine+Cleaning",
        "is_active": True
    },
    {
        "name": "Interior Cleaning",
        "description": "Pembersihan menyeluruh interior mobil dari debu, noda, dan kotoran",
        "price": 400000,
        "duration_minutes": 120,
        "category": "interior",
        "commission_rate": 10.0,
        "image_url": "https://via.placeholder.com/300x200.png?text=Interior+Cleaning",
        "is_active": True
    },
    {
        "name": "Nano Ceramic Coating Ultimate",
        "description": "Coating nano ceramic ultimate dengan proteksi terbaik. Harga asli ~Rp. 8.450.000",
        "price": 4013750,
        "duration_minutes": 300,
        "category": "coating",
        "commission_rate": 5.0,
        "image_url": "https://via.placeholder.com/300x200.png?text=Nano+Ceramic+Ultimate",
        "is_active": True
    },
    {
        "name": "Nano Ceramic Coating Silver",
        "description": "Coating nano ceramic silver dengan perlindungan optimal. Harga normal ~Rp. 4.900.000",
        "price": 2450000,
        "duration_minutes": 210,
        "category": "coating",
        "commission_rate": 5.0,
        "image_url": "https://via.placeholder.com/300x200.png?text=Nano+Ceramic+Silver",
        "is_active": True
    },
    {
        "name": "Premium Wash Gold",
        "description": "Cuci Premium menggunakan; - Shampoo Premium - Semir Ban - Vacum - Lap Interior/Dashboard",
        "price": 100000,
        "duration_minutes": 30,
        "category": "exterior",
        "commission_rate": 10.0,
        "image_url": "https://via.placeholder.com/300x200.png?text=Premium+Wash+Gold",
        "is_active": True
    },
    {
        "name": "Premium Wash Platinum",
        "description": "Cuci Premium menggunakan; - Shampoo Premium - Semir Ban - Vacum - Lap Interior/Dashboard - Extra Shine",
        "price": 120000,
        "duration_minutes": 35,
        "category": "exterior",
        "commission_rate": 10.0,
        "image_url": "https://via.placeholder.com/300x200.png?text=Premium+Wash+Platinum",
        "is_active": True
    },
]

async def import_catalog():
    print("🚀 Starting catalog import...")
    
    imported = 0
    skipped = 0
    
    for service_data in catalog_services:
        # Check if service already exists
        existing = await db.services.find_one({"name": service_data["name"]}, {"_id": 0})
        
        if existing:
            print(f"⏭️  Skipped: {service_data['name']} (already exists)")
            skipped += 1
            continue
        
        # Add metadata
        service_data["id"] = str(uuid.uuid4())
        service_data["bom"] = []
        
        await db.services.insert_one(service_data)
        print(f"✅ Imported: {service_data['name']} - Rp {service_data['price']:,}")
        imported += 1
    
    print(f"\n🎉 Import complete!")
    print(f"   ✅ Imported: {imported} services")
    print(f"   ⏭️  Skipped: {skipped} services (already exist)")
    print(f"\n💡 Total services in catalog: {len(catalog_services)}")

if __name__ == "__main__":
    asyncio.run(import_catalog())
