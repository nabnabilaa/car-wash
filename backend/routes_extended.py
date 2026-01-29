from fastapi import HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from typing import List
import os

# Import from server.py
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Extended Routes for Services, Products, Customers, Memberships

async def update_service_route(service_id: str, service_data, current_user):
    """Update service including BOM"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_data = {k: v for k, v in service_data.model_dump().items() if v is not None}
    if update_data:
        await db.services.update_one({"id": service_id}, {"$set": update_data})
        service.update(update_data)
    
    return service

async def create_product_route(product_data, current_user):
    """Create physical product"""
    from server import Product
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    await db.products.insert_one(doc)
    return product

async def get_products_route(current_user):
    """Get all products"""
    products = await db.products.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return products

async def update_product_route(product_id: str, product_data, current_user):
    """Update product"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
        product.update(update_data)
    
    return product

async def update_customer_route(customer_id: str, customer_data, current_user):
    """Update customer"""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = {k: v for k, v in customer_data.model_dump().items() if v is not None}
    if update_data:
        await db.customers.update_one({"id": customer_id}, {"$set": update_data})
        customer.update(update_data)
    
    if isinstance(customer.get('join_date'), str):
        customer['join_date'] = datetime.fromisoformat(customer['join_date'])
    
    return customer

async def get_customer_transactions_route(customer_id: str, current_user):
    """Get all transactions for a customer"""
    transactions = await db.transactions.find(
        {"customer_id": customer_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for t in transactions:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    
    return transactions

async def get_membership_detail_route(membership_id: str, current_user):
    """Get membership detail with usage history"""
    membership = await db.memberships.find_one({"id": membership_id}, {"_id": 0})
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    # Get usage history
    usage_history = await db.membership_usage.find(
        {"membership_id": membership_id},
        {"_id": 0}
    ).sort("used_at", -1).to_list(1000)
    
    for usage in usage_history:
        if isinstance(usage.get('used_at'), str):
            usage['used_at'] = datetime.fromisoformat(usage['used_at'])
    
    # Convert dates
    if isinstance(membership.get('start_date'), str):
        membership['start_date'] = datetime.fromisoformat(membership['start_date'])
    if isinstance(membership.get('end_date'), str):
        membership['end_date'] = datetime.fromisoformat(membership['end_date'])
    if isinstance(membership.get('created_at'), str):
        membership['created_at'] = datetime.fromisoformat(membership['created_at'])
    if isinstance(membership.get('last_used'), str):
        membership['last_used'] = datetime.fromisoformat(membership['last_used'])
    
    # Update status
    now = datetime.now(timezone.utc)
    if membership['end_date'] < now:
        membership['status'] = 'expired'
    elif (membership['end_date'] - now).days <= 7:
        membership['status'] = 'expiring_soon'
    else:
        membership['status'] = 'active'
    
    membership['usage_history'] = usage_history
    
    return membership

async def record_membership_usage_route(usage_data, current_user):
    """Record All You Can Wash usage"""
    # Find customer by phone
    customer = await db.customers.find_one({"phone": usage_data.phone}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Find active membership
    now = datetime.now(timezone.utc)
    memberships = await db.memberships.find(
        {"customer_id": customer['id']},
        {"_id": 0}
    ).to_list(100)
    
    active_membership = None
    for m in memberships:
        end_date = datetime.fromisoformat(m['end_date']) if isinstance(m['end_date'], str) else m['end_date']
        if end_date >= now and m['membership_type'] != 'regular':
            active_membership = m
            break
    
    if not active_membership:
        raise HTTPException(status_code=400, detail="No active All You Can Wash membership")
    
    # Check if already used today
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_usage = await db.membership_usage.find_one({
        "membership_id": active_membership['id'],
        "used_at": {"$gte": today_start.isoformat()}
    })
    
    if today_usage:
        raise HTTPException(status_code=400, detail="Membership sudah digunakan hari ini. Limit 1x per hari.")
    
    # Get service info
    service = await db.services.find_one({"id": usage_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Record usage
    usage_record = {
        "id": str(__import__('uuid').uuid4()),
        "membership_id": active_membership['id'],
        "customer_id": customer['id'],
        "customer_name": customer['name'],
        "service_id": service['id'],
        "service_name": service['name'],
        "kasir_id": current_user.id,
        "kasir_name": current_user.full_name,
        "used_at": now.isoformat()
    }
    
    await db.membership_usage.insert_one(usage_record)
    
    # Update membership usage count and last_used
    await db.memberships.update_one(
        {"id": active_membership['id']},
        {
            "$inc": {"usage_count": 1},
            "$set": {"last_used": now.isoformat()}
        }
    )
    
    # Deduct inventory if service has BOM
    if service.get('bom') and len(service['bom']) > 0:
        for bom_item in service['bom']:
            await db.inventory.update_one(
                {"id": bom_item['inventory_id']},
                {"$inc": {"current_stock": -bom_item['quantity']}}
            )
    
    return {
        "message": "Usage recorded successfully",
        "customer_name": customer['name'],
        "service_name": service['name'],
        "membership_type": active_membership['membership_type'],
        "remaining_days": (datetime.fromisoformat(active_membership['end_date']) if isinstance(active_membership['end_date'], str) else active_membership['end_date'] - now).days,
        "usage_count": active_membership['usage_count'] + 1
    }

async def deduct_inventory_for_transaction(items, db):
    """Deduct inventory based on transaction items"""
    for item in items:
        # Check if it's a service with BOM
        if item.get('service_id'):
            service = await db.services.find_one({"id": item['service_id']}, {"_id": 0})
            if service and service.get('bom') and len(service['bom']) > 0:
                for bom_item in service['bom']:
                    quantity_to_deduct = bom_item['quantity'] * item['quantity']
                    await db.inventory.update_one(
                        {"id": bom_item['inventory_id']},
                        {"$inc": {"current_stock": -quantity_to_deduct}}
                    )
        
        # Check if it's a product linked to inventory
        elif item.get('product_id'):
            product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
            if product and product.get('inventory_id'):
                await db.inventory.update_one(
                    {"id": product['inventory_id']},
                    {"$inc": {"current_stock": -item['quantity']}}
                )
