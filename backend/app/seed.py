import random
from datetime import datetime, timedelta

from .database import SessionLocal, engine, Base
from . import models


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.Product).count() > 0:
            print("Already seeded, skipping.")
            return

        # ---------- Categories ----------
        tech_categories = {
            slug: models.Category(name=name, slug=slug, group="tech")
            for slug, name in [
                ("cpu", "Processors"),
                ("motherboard", "Motherboards"),
                ("ram", "Memory"),
                ("gpu", "Graphics Cards"),
                ("storage", "Storage"),
                ("psu", "Power Supplies"),
                ("case", "Cases"),
            ]
        }
        grocery_categories = {
            slug: models.Category(name=name, slug=slug, group="grocery", unit=unit)
            for slug, name, unit in [
                ("vegetables", "Vegetables", "kg"),
                ("fruits", "Fruits", "kg"),
                ("dairy", "Dairy", "unit"),
                ("staples", "Staples", "kg"),
            ]
        }
        categories = {**tech_categories, **grocery_categories}
        db.add_all(categories.values())
        db.flush()

        # ---------- Vendors ----------
        vendors = [
            models.Vendor(name="Sri Lakshmi Computers", locality="Ameerpet, Hyderabad", distance_km=2.1, rating=4.6),
            models.Vendor(name="TechBazaar Hitech City", locality="Hitech City, Hyderabad", distance_km=4.8, rating=4.3),
            models.Vendor(name="Localync Direct", locality="Online", distance_km=0, rating=4.8),
            models.Vendor(name="Ameerpet Fresh Mart", locality="Ameerpet, Hyderabad", distance_km=0.8, rating=4.4),
            models.Vendor(name="Banjara Organics", locality="Banjara Hills, Hyderabad", distance_km=3.2, rating=4.7),
        ]
        db.add_all(vendors)
        db.flush()

        # ---------- Technicians ----------
        technicians = [
            models.Technician(name="Ravi Kumar", specialty="PC hardware & upgrades",
                               locality="Ameerpet, Hyderabad", distance_km=1.6, rating=4.7, available=True),
            models.Technician(name="Priya Reddy", specialty="Laptop repair & screen replacement",
                               locality="Hitech City, Hyderabad", distance_km=3.4, rating=4.5, available=True),
            models.Technician(name="Mohammed Ayaan", specialty="GPU & PSU diagnostics",
                               locality="Kukatpally, Hyderabad", distance_km=5.9, rating=4.6, available=True),
        ]
        db.add_all(technicians)
        db.flush()

        def price_history(base: float, days=180, volatility=0.06):
            points = []
            price = base * 1.08
            now = datetime.utcnow()
            for i in range(days, -1, -15):
                drift = random.uniform(-volatility, volatility)
                price = max(base * 0.85, price * (1 + drift))
                points.append(models.PricePoint(price=round(price, 2), recorded_at=now - timedelta(days=i)))
            points.append(models.PricePoint(price=base, recorded_at=now))
            return points

        # ---------- Tech products ----------
        tech_products = [
            dict(name="Ryzen 7 9700X", brand="AMD", category="cpu", vendor=2, price=32999,
                 socket="AM5", wattage_draw=65, score_performance=92, score_value=85,
                 score_upgradeability=90, score_repairability=60, score_longevity=88,
                 summary="Strong 1440p gaming CPU with an AM5 platform that AMD has committed to through 2027 — good upgrade runway."),
            dict(name="Core i5-14600K", brand="Intel", category="cpu", vendor=1, price=27999,
                 socket="LGA1700", wattage_draw=125, score_performance=88, score_value=90,
                 score_upgradeability=55, score_repairability=60, score_longevity=70,
                 summary="Excellent price-to-performance, but LGA1700 is near the end of its platform life."),
            dict(name="MSI MAG B650 Tomahawk", brand="MSI", category="motherboard", vendor=2, price=18999,
                 socket="AM5", ram_type="DDR5", form_factor="ATX", score_performance=85,
                 score_value=88, score_upgradeability=90, score_repairability=65, score_longevity=85,
                 summary="Solid VRM and DDR5 support with headroom for future AM5 CPU upgrades."),
            dict(name="ASUS TUF B760M-Plus", brand="ASUS", category="motherboard", vendor=1, price=13499,
                 socket="LGA1700", ram_type="DDR5", form_factor="mATX", score_performance=78,
                 score_value=85, score_upgradeability=50, score_repairability=65, score_longevity=65,
                 summary="Reliable mATX board for LGA1700 builds; limited upgrade path as the platform ages."),
            dict(name="Corsair Vengeance 32GB DDR5-6000", brand="Corsair", category="ram", vendor=3, price=8999,
                 ram_type="DDR5", ram_capacity_gb=32, score_performance=90, score_value=82,
                 score_upgradeability=70, score_repairability=40, score_longevity=85,
                 summary="Sweet-spot capacity and speed for 1440p gaming and light content work."),
            dict(name="Kingston Fury 16GB DDR4-3200", brand="Kingston", category="ram", vendor=1, price=3299,
                 ram_type="DDR4", ram_capacity_gb=16, score_performance=70, score_value=88,
                 score_upgradeability=40, score_repairability=40, score_longevity=55,
                 summary="Budget-friendly DDR4 kit — fine for older platforms, a bottleneck on newer ones."),
            dict(name="RTX 5070", brand="NVIDIA", category="gpu", vendor=3, price=54999,
                 wattage_draw=220, length_mm=280, score_performance=91, score_value=80,
                 score_upgradeability=60, score_repairability=45, score_longevity=82,
                 summary="Excellent performance for 1440p gaming with strong upgrade potential and good ray-tracing headroom."),
            dict(name="RTX 4060", brand="NVIDIA", category="gpu", vendor=1, price=28499,
                 wattage_draw=115, length_mm=245, score_performance=76, score_value=84,
                 score_upgradeability=45, score_repairability=45, score_longevity=68,
                 summary="Efficient 1080p performer; VRAM ceiling limits future-proofing at higher settings."),
            dict(name="Samsung 980 Pro 1TB NVMe", brand="Samsung", category="storage", vendor=3, price=7499,
                 storage_capacity_gb=1000, score_performance=93, score_value=78, score_upgradeability=70,
                 score_repairability=30, score_longevity=80,
                 summary="Fast Gen4 NVMe drive with headroom for large game libraries."),
            dict(name="WD Blue 512GB SATA SSD", brand="Western Digital", category="storage", vendor=1, price=2799,
                 storage_capacity_gb=512, score_performance=60, score_value=85, score_upgradeability=50,
                 score_repairability=30, score_longevity=60,
                 summary="Dependable budget SSD; fine as a secondary drive, not ideal as your only one."),
            dict(name="Corsair RM750e 750W Gold", brand="Corsair", category="psu", vendor=2, price=8499,
                 wattage_supply=750, score_performance=88, score_value=82, score_upgradeability=80,
                 score_repairability=50, score_longevity=90,
                 summary="750W of clean, efficient power with headroom for a future GPU upgrade."),
            dict(name="Ant Value 500W", brand="Ant Esports", category="psu", vendor=1, price=2899,
                 wattage_supply=500, score_performance=55, score_value=75, score_upgradeability=30,
                 score_repairability=35, score_longevity=45,
                 summary="Budget unit — fine for entry builds, but leaves little room to add a stronger GPU later."),
            dict(name="NZXT H5 Flow", brand="NZXT", category="case", vendor=3, price=6999,
                 form_factor="ATX", max_gpu_length_mm=365, score_performance=80, score_value=82,
                 score_upgradeability=85, score_repairability=70, score_longevity=88,
                 summary="Great airflow and plenty of GPU clearance for future upgrades."),
            dict(name="Deepcool Matrexx 40", brand="Deepcool", category="case", vendor=1, price=3299,
                 form_factor="mATX", max_gpu_length_mm=320, score_performance=68, score_value=88,
                 score_upgradeability=55, score_repairability=60, score_longevity=65,
                 summary="Compact and affordable, with enough clearance for most mid-range GPUs."),
        ]

        # ---------- Grocery products (hyper-local) ----------
        grocery_products = [
            dict(name="Tomatoes", brand="Farm Fresh", category="vegetables", vendor=4, price=40,
                 score_performance=80, score_value=85, score_upgradeability=0, score_repairability=0,
                 score_longevity=40, summary="Locally sourced, picked within the last 2 days."),
            dict(name="Onions", brand="Farm Fresh", category="vegetables", vendor=4, price=35,
                 score_performance=78, score_value=88, score_upgradeability=0, score_repairability=0,
                 score_longevity=70, summary="Standard red onions, good keeping quality."),
            dict(name="Potatoes", brand="Farm Fresh", category="vegetables", vendor=4, price=32,
                 score_performance=75, score_value=90, score_upgradeability=0, score_repairability=0,
                 score_longevity=75, summary="All-purpose potatoes, stores well for 2-3 weeks."),
            dict(name="Bananas", brand="Banjara Organics", category="fruits", vendor=5, price=60,
                 score_performance=82, score_value=80, score_upgradeability=0, score_repairability=0,
                 score_longevity=35, summary="Organically grown, ripens over 3-4 days at room temperature."),
            dict(name="Apples (Shimla)", brand="Banjara Organics", category="fruits", vendor=5, price=180,
                 score_performance=85, score_value=70, score_upgradeability=0, score_repairability=0,
                 score_longevity=60, summary="Crisp Shimla apples, keeps well refrigerated for 2+ weeks."),
            dict(name="Full Cream Milk (1L)", brand="Ameerpet Dairy", category="dairy", vendor=4, price=68,
                 score_performance=88, score_value=82, score_upgradeability=0, score_repairability=0,
                 score_longevity=20, summary="Pasteurized, delivered same-day from a local dairy."),
            dict(name="Toor Dal (1kg)", brand="Banjara Organics", category="staples", vendor=5, price=165,
                 score_performance=80, score_value=78, score_upgradeability=0, score_repairability=0,
                 score_longevity=95, summary="Unpolished toor dal, long shelf life, stone-free."),
        ]

        all_products = tech_products + grocery_products
        created = []
        for p in all_products:
            cat = categories[p.pop("category")]
            vendor = vendors[p.pop("vendor") - 1]
            base_price = p["price"]
            product = models.Product(
                **p,
                category_id=cat.id,
                vendor_id=vendor.id,
                stock=random.randint(3, 40),
                image_seed=p["name"].lower().replace(" ", "-"),
            )
            db.add(product)
            db.flush()
            for pt in price_history(base_price):
                pt.product_id = product.id
                db.add(pt)
            created.append(product)

        db.flush()

        # ---------- Demo orders (so the vendor dashboard has something to show) ----------
        demo_customer = models.User(
            name="Demo Shopper", email="demo.shopper@localync.test",
            hashed_password="$2b$12$seedaccountnotarealbcrypthashXXXXXXXXXXXXXXXXXXXXXXXXX",
            role=models.Role.customer,
        )
        db.add(demo_customer)
        db.flush()

        now = datetime.utcnow()
        for i in range(6):
            product = random.choice(created)
            qty = random.randint(1, 3)
            order = models.Order(
                user_id=demo_customer.id, total=round(product.price * qty, 2),
                status=models.OrderStatus.delivered,
                created_at=now - timedelta(hours=random.randint(1, 20)),
            )
            db.add(order)
            db.flush()
            db.add(models.OrderItem(
                order_id=order.id, product_id=product.id, vendor_id=product.vendor_id,
                quantity=qty, price_at_purchase=product.price,
            ))

        db.commit()
        print(f"Seeded {len(all_products)} products across {len(categories)} categories, "
              f"{len(vendors)} vendors, {len(technicians)} technicians.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
