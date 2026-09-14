from typing import Dict, Any, Optional

VERIFIED_CROP_BENCHMARKS: Dict[str, Dict[str, Any]] = {
    "wheat": {
        "crop_name": "Wheat (Kanak)",
        "verified": True,
        "source": "ICAR / Punjab Agricultural University (PAU) Package of Practices",
        "seed_rate_kg_per_acre": 40.0,
        "seed_cost_per_kg": 45.0,
        "fertilizers": {
            "urea_kg_per_acre": 110.0,
            "dap_kg_per_acre": 55.0,
            "mop_kg_per_acre": 20.0,
            "zinc_kg_per_acre": 10.0
        },
        "fertilizer_prices_per_kg": {
            "urea": 6.0,    # Subsidized ~₹266/45kg
            "dap": 27.0,   # Subsidized ~₹1350/50kg
            "mop": 34.0,   # ~₹1700/50kg
            "zinc": 70.0
        },
        "irrigation_count": 4,
        "irrigation_cost_per_acre": 1500.0,
        "plant_protection_cost_per_acre": 1200.0, # Weeds & yellow rust sprays
        "labor_cost_per_acre": 3500.0,            # Sowing, weeding & harvesting
        "other_inputs_cost_per_acre": 1500.0,     # Machinery & field prep
        "yield_qtl_per_acre_range": (18.0, 22.0),
        "average_yield_qtl_per_acre": 20.0,
        "benchmark_price_per_qtl": 2275.0,        # MSP Baseline
    },

    "paddy": {
        "crop_name": "Paddy / Rice (Basmati 1121)",
        "verified": True,
        "source": "ICAR / PAU Recommended Rice agronomy guidelines",
        "seed_rate_kg_per_acre": 8.0, # Nursery seed rate per acre of main field
        "seed_cost_per_kg": 110.0,
        "fertilizers": {
            "urea_kg_per_acre": 90.0,
            "dap_kg_per_acre": 40.0,
            "mop_kg_per_acre": 20.0,
            "zinc_kg_per_acre": 10.0
        },
        "fertilizer_prices_per_kg": {
            "urea": 6.0,
            "dap": 27.0,
            "mop": 34.0,
            "zinc": 70.0
        },
        "irrigation_count": 12,
        "irrigation_cost_per_acre": 3500.0,
        "plant_protection_cost_per_acre": 2200.0, # Stem borer & sheath blight
        "labor_cost_per_acre": 5500.0,            # Nursery, transplantation & harvesting
        "other_inputs_cost_per_acre": 2000.0,
        "yield_qtl_per_acre_range": (18.0, 24.0),
        "average_yield_qtl_per_acre": 21.0,
        "benchmark_price_per_qtl": 3800.0,
    },

    "cotton": {
        "crop_name": "Cotton (Bt Hybrid)",
        "verified": True,
        "source": "Central Institute for Cotton Research (CICR)",
        "seed_rate_kg_per_acre": 1.8, # Packet seeding per acre
        "seed_cost_per_kg": 480.0,
        "fertilizers": {
            "urea_kg_per_acre": 130.0,
            "dap_kg_per_acre": 60.0,
            "mop_kg_per_acre": 30.0,
            "zinc_kg_per_acre": 10.0
        },
        "fertilizer_prices_per_kg": {
            "urea": 6.0,
            "dap": 27.0,
            "mop": 34.0,
            "zinc": 70.0
        },
        "irrigation_count": 5,
        "irrigation_cost_per_acre": 2000.0,
        "plant_protection_cost_per_acre": 3500.0, # Whitefly & bollworm protection
        "labor_cost_per_acre": 6000.0,            # Multiple picking labor
        "other_inputs_cost_per_acre": 2200.0,
        "yield_qtl_per_acre_range": (8.0, 12.0),
        "average_yield_qtl_per_acre": 10.0,
        "benchmark_price_per_qtl": 6600.0,
    },

    "mustard": {
        "crop_name": "Mustard / Sarson (Pusa Bold)",
        "verified": True,
        "source": "Directorate of Rapeseed-Mustard Research (DRMR)",
        "seed_rate_kg_per_acre": 2.0,
        "seed_cost_per_kg": 150.0,
        "fertilizers": {
            "urea_kg_per_acre": 65.0,
            "dap_kg_per_acre": 35.0,
            "mop_kg_per_acre": 15.0,
            "zinc_kg_per_acre": 5.0
        },
        "fertilizer_prices_per_kg": {
            "urea": 6.0,
            "dap": 27.0,
            "mop": 34.0,
            "zinc": 70.0
        },
        "irrigation_count": 2,
        "irrigation_cost_per_acre": 1000.0,
        "plant_protection_cost_per_acre": 1000.0, # Aphid management
        "labor_cost_per_acre": 2800.0,
        "other_inputs_cost_per_acre": 1200.0,
        "yield_qtl_per_acre_range": (7.0, 10.0),
        "average_yield_qtl_per_acre": 8.5,
        "benchmark_price_per_qtl": 5400.0,
    },

    "maize": {
        "crop_name": "Maize / Corn (Hybrid)",
        "verified": True,
        "source": "ICAR - Indian Institute of Maize Research (IIMR)",
        "seed_rate_kg_per_acre": 8.0,
        "seed_cost_per_kg": 220.0,
        "fertilizers": {
            "urea_kg_per_acre": 100.0,
            "dap_kg_per_acre": 50.0,
            "mop_kg_per_acre": 20.0,
            "zinc_kg_per_acre": 10.0
        },
        "fertilizer_prices_per_kg": {
            "urea": 6.0,
            "dap": 27.0,
            "mop": 34.0,
            "zinc": 70.0
        },
        "irrigation_count": 4,
        "irrigation_cost_per_acre": 1600.0,
        "plant_protection_cost_per_acre": 1400.0, # Fall Armyworm spray
        "labor_cost_per_acre": 3200.0,
        "other_inputs_cost_per_acre": 1400.0,
        "yield_qtl_per_acre_range": (20.0, 26.0),
        "average_yield_qtl_per_acre": 23.0,
        "benchmark_price_per_qtl": 2090.0,
    },

    "potato": {
        "crop_name": "Potato (Kufri Jyoti)",
        "verified": True,
        "source": "ICAR - Central Potato Research Institute (CPRI)",
        "seed_rate_kg_per_acre": 1000.0, # Seed tubers per acre (~10 quintals)
        "seed_cost_per_kg": 22.0,
        "fertilizers": {
            "urea_kg_per_acre": 150.0,
            "dap_kg_per_acre": 100.0,
            "mop_kg_per_acre": 60.0,
            "zinc_kg_per_acre": 10.0
        },
        "fertilizer_prices_per_kg": {
            "urea": 6.0,
            "dap": 27.0,
            "mop": 34.0,
            "zinc": 70.0
        },
        "irrigation_count": 6,
        "irrigation_cost_per_acre": 2400.0,
        "plant_protection_cost_per_acre": 2800.0, # Late blight sprays
        "labor_cost_per_acre": 7000.0,            # Earthing up & harvesting labor
        "other_inputs_cost_per_acre": 3000.0,
        "yield_qtl_per_acre_range": (90.0, 130.0),
        "average_yield_qtl_per_acre": 110.0,
        "benchmark_price_per_qtl": 1450.0,
    }
}

def get_crop_agri_benchmark(crop_name: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve verified crop benchmark data if available.
    Supports partial fuzzy matching (e.g. 'Wheat', 'Paddy', 'Basmati', 'Cotton').
    """
    if not crop_name:
        return None

    query = crop_name.strip().lower()
    
    # Direct match
    for key, data in VERIFIED_CROP_BENCHMARKS.items():
        if key in query or query in key or query in data["crop_name"].lower():
            return data
            
    # Fuzzy alias check
    if "rice" in query or "jhana" in query or "paddy" in query:
        return VERIFIED_CROP_BENCHMARKS["paddy"]
    if "kanak" in query or "gehun" in query or "wheat" in query:
        return VERIFIED_CROP_BENCHMARKS["wheat"]
    if "kapas" in query or "cotton" in query:
        return VERIFIED_CROP_BENCHMARKS["cotton"]
    if "sarson" in query or "mustard" in query:
        return VERIFIED_CROP_BENCHMARKS["mustard"]
    if "makka" in query or "maize" in query or "corn" in query:
        return VERIFIED_CROP_BENCHMARKS["maize"]
    if "alu" in query or "potato" in query:
        return VERIFIED_CROP_BENCHMARKS["potato"]

    return None
