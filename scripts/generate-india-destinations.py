#!/usr/bin/env python3
"""Add 15 more India destinations."""
import json, os, re

BASE = "C:/HonestNomad"

def mm(m, h, l, r, hu, d):
    return {"month":m,"avgHighC":h,"avgLowC":l,"rainProbability":r,"humidity":hu,"description":d}

WEATHER = {
  "indian_tropical": [
    mm(1,29,19,"low","low","Dry and warm; peak tourist season with clear skies."),
    mm(2,31,20,"low","low","Warming up; still dry and comfortable."),
    mm(3,34,23,"low","low","Hot and dry; temperatures rising steadily."),
    mm(4,37,26,"low","moderate","Very hot; pre-monsoon heat builds."),
    mm(5,38,28,"moderate","high","Extremely hot and humid; monsoon approaching."),
    mm(6,35,27,"high","high","Monsoon arrives with heavy rains and cooler air."),
    mm(7,32,26,"high","high","Peak monsoon; heavy rainfall and lush green landscapes."),
    mm(8,31,25,"high","high","Continued monsoon; flooding possible in some areas."),
    mm(9,32,25,"high","high","Monsoon winding down; rain still frequent."),
    mm(10,33,24,"moderate","moderate","Post-monsoon; clearing skies and pleasant temperatures."),
    mm(11,31,21,"low","moderate","Dry and comfortable; tourist season begins."),
    mm(12,29,18,"low","low","Cool, dry, and pleasant; peak season."),
  ],
  "indian_highland": [
    mm(1,12,3,"low","moderate","Cool and dry with clear mountain views; pack warm layers."),
    mm(2,14,5,"low","moderate","Slightly warmer; spring begins at lower altitudes."),
    mm(3,18,9,"moderate","moderate","Warming steadily; mountain trails open up."),
    mm(4,21,12,"moderate","moderate","Pleasant spring weather; wildflowers bloom."),
    mm(5,22,14,"high","high","Pre-monsoon heat with increasing humidity."),
    mm(6,22,16,"high","high","Monsoon arrives; heavy rain and misty mountains."),
    mm(7,22,16,"high","high","Peak monsoon; lush green but limited visibility."),
    mm(8,22,16,"high","high","Continued monsoon; leeches and landslides possible on trails."),
    mm(9,22,15,"high","high","Monsoon fading; trails begin to clear."),
    mm(10,20,11,"moderate","moderate","Post-monsoon clarity; stunning mountain views return."),
    mm(11,17,7,"low","moderate","Cool and dry; excellent trekking conditions."),
    mm(12,13,4,"low","moderate","Cold but clear; peak season for mountain views."),
  ],
  "indian_arid": [
    mm(1,24,8,"low","low","Cool and dry; perfect desert weather with clear skies."),
    mm(2,27,11,"low","low","Warming up; still pleasant and dry."),
    mm(3,33,17,"low","low","Getting hot; desert heat starts to build."),
    mm(4,38,22,"low","low","Very hot; limit outdoor activity to mornings and evenings."),
    mm(5,41,27,"low","low","Extreme heat; the desert bakes under relentless sun."),
    mm(6,40,28,"moderate","moderate","Pre-monsoon; occasional dust storms and scattered rain."),
    mm(7,36,27,"moderate","high","Monsoon brings some relief; brief but intense showers."),
    mm(8,34,25,"moderate","high","Continued monsoon influence; slightly cooler."),
    mm(9,35,24,"low","moderate","Monsoon retreating; heat returns."),
    mm(10,35,20,"low","low","Cooling down; pleasant evenings return."),
    mm(11,30,14,"low","low","Comfortable and dry; ideal visiting conditions."),
    mm(12,25,9,"low","low","Cool and dry; peak tourist season."),
  ],
  "indian_south_coastal": [
    mm(1,30,22,"low","moderate","Warm and dry; perfect beach weather."),
    mm(2,31,23,"low","moderate","Slightly warmer; continued dry conditions."),
    mm(3,33,25,"low","moderate","Hot and humid; sea breezes provide relief."),
    mm(4,34,26,"moderate","high","Very hot and humid; pre-monsoon showers possible."),
    mm(5,35,27,"moderate","high","Hot with building humidity; first rains may arrive."),
    mm(6,33,25,"high","high","Southwest monsoon brings heavy rain."),
    mm(7,31,24,"high","high","Peak monsoon; heavy rain and rough seas."),
    mm(8,31,24,"high","high","Continued monsoon; lush green landscapes."),
    mm(9,31,24,"high","high","Monsoon continues; rain gradually easing."),
    mm(10,31,24,"high","high","Northeast monsoon begins; continued rain on east coast."),
    mm(11,30,23,"moderate","high","Rain easing on west coast; east coast still wet."),
    mm(12,29,22,"low","moderate","Dry season returns; comfortable and pleasant."),
  ],
  "ladakh_high_altitude": [
    mm(1,-2,-14,"low","low","Extremely cold and snowy; most roads closed."),
    mm(2,1,-12,"low","low","Still bitterly cold; frozen rivers create the Chadar trek."),
    mm(3,7,-5,"low","low","Slowly warming; snow begins to melt at lower elevations."),
    mm(4,13,1,"low","low","Spring arrives; passes begin to open."),
    mm(5,18,6,"low","low","Pleasant days and cool nights; tourism season begins."),
    mm(6,24,10,"low","low","Warm and dry; best month for trekking and sightseeing."),
    mm(7,27,14,"moderate","moderate","Warmest month; some monsoon moisture reaches Ladakh."),
    mm(8,26,13,"moderate","moderate","Still warm; occasional rain showers."),
    mm(9,22,8,"low","low","Cooling down; clear skies and golden light."),
    mm(10,14,1,"low","low","Cold nights return; most trekking wraps up."),
    mm(11,7,-5,"low","low","Cold and dry; tourist facilities begin closing."),
    mm(12,0,-11,"low","low","Deep winter; roads snow-blocked; very few visitors."),
  ],
  "indian_tropical_island": [
    mm(1,30,23,"low","moderate","Dry season; perfect beach and diving conditions."),
    mm(2,30,23,"low","moderate","Continued dry weather; crystal-clear waters."),
    mm(3,31,24,"low","moderate","Warming up; still excellent visibility for snorkeling."),
    mm(4,32,25,"moderate","high","Getting humid; occasional showers begin."),
    mm(5,31,25,"high","high","Southwest monsoon approaches; seas getting rough."),
    mm(6,30,25,"high","high","Full monsoon; heavy rain and rough seas."),
    mm(7,29,24,"high","high","Peak monsoon; many water activities suspended."),
    mm(8,29,24,"high","high","Continued heavy rain; lush green islands."),
    mm(9,30,24,"high","high","Monsoon easing slightly; still rainy."),
    mm(10,30,24,"high","high","Transitional month; rain tapering off."),
    mm(11,31,24,"moderate","moderate","Dry season begins; good conditions return."),
    mm(12,30,23,"low","moderate","Peak season; dry, warm, and ideal for diving."),
  ],
}

COST = {
    "budget": (1500, 15, 10, 5),
    "moderate": (2500, 35, 20, 10),
    "expensive": (3500, 60, 30, 15),
}

UNSPLASH_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800",
    "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800",
    "https://images.unsplash.com/photo-1532664189809-02133fee698d?w=800",
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800",
]

# (id, city, country, airport, region, lat, lon, vibes, bestMonths, costLevel,
#  highlights, weatherPreset, tempOffset, transport, safety, water, tz, pitch)
DESTS = [
("leh-ladakh","Leh-Ladakh","India","IXL","asia",34.15,77.58,
 ["adventure","nature","culture","photography"],[6,7,8,9],"budget",
 ["Pangong Lake","Nubra Valley","Khardung La pass","Buddhist monasteries"],
 "ladakh_high_altitude",0,
 "Leh is walkable but at 3,500m altitude — acclimatize for a day before exploring. Ladakh's vast distances require hired cars or bikes along dramatic mountain roads.",
 "safe","bottled-only","UTC+5:30",
 "Pangong Lake's impossible blue stretching to the horizon, Khardung La — one of the world's highest motorable passes — and ancient monasteries clinging to cliffsides. Ladakh is India's last frontier, where the landscape is so vast it recalibrates your sense of scale."),
("jaisalmer","Jaisalmer","India","JSA","asia",26.92,70.91,
 ["history","adventure","photography","culture"],[10,11,12,1,2,3],"budget",
 ["Golden Fort","Sam Sand Dunes","Havelis","Camel safaris"],
 "indian_arid",0,
 "Jaisalmer's fort and old city are walkable; camel safaris and the Sam Sand Dunes are a 40km drive arranged through operators.",
 "safe","bottled-only","UTC+5:30",
 "The Golden City — Jaisalmer's sandstone fort glows like liquid gold at sunset, intricately carved havelis showcase impossible stonework, and sleeping under the stars on a camel safari in the Thar Desert is an experience that stays with you forever."),
("kolkata","Kolkata","India","CCU","asia",22.57,88.36,
 ["culture","food","history","art"],[10,11,12,1,2,3],"budget",
 ["Victoria Memorial","Howrah Bridge","Street food capital","Literary culture"],
 "indian_tropical",0,
 "Kolkata has a metro system and iconic yellow taxis; the central areas around Park Street, New Market, and the Maidan are walkable.",
 "safe","bottled-only","UTC+5:30",
 "The Victoria Memorial gleaming at dusk, Howrah Bridge carrying a million people daily, and street food — kathi rolls, phuchka, mishti doi — that's the best in India. Kolkata is the country's intellectual and cultural soul, raw and magnificent."),
("hyderabad","Hyderabad","India","HYD","asia",17.39,78.49,
 ["food","history","culture","city"],[10,11,12,1,2,3],"budget",
 ["Charminar","Biryani capital","Golconda Fort","Ramoji Film City"],
 "indian_tropical",1,
 "Hyderabad is a large city with ride-hailing apps working well; the old city around Charminar is walkable but chaotic in the best way.",
 "safe","bottled-only","UTC+5:30",
 "The biryani capital of the world — Hyderabadi dum biryani is slow-cooked perfection. The Charminar anchors a buzzing old city, Golconda Fort has acoustics that let a clap travel a kilometer, and the pearl markets are legendary."),
("shimla","Shimla","India","SLV","asia",31.10,77.17,
 ["nature","history","culture","relaxation"],[3,4,5,6,9,10],"budget",
 ["Mall Road","Toy train","Colonial architecture","Himalayan views"],
 "indian_highland",0,
 "Shimla's Mall Road and Ridge are pedestrianized and walkable; the toy train from Kalka is a UNESCO-listed journey through 102 tunnels.",
 "safe","tap-safe","UTC+5:30",
 "The toy train winding through 102 tunnels to reach the former summer capital of British India — Shimla's colonial architecture, Mall Road promenades, and Himalayan panoramas make it the classic Indian hill station experience."),
("manali","Manali","India","KUU","asia",32.24,77.19,
 ["adventure","nature","skiing"],[3,4,5,6,9,10],"budget",
 ["Rohtang Pass","Solang Valley","Old Manali","River rafting"],
 "indian_highland",-2,
 "Manali is split between the mall area and Old Manali; local buses and taxis connect to Solang Valley and Rohtang Pass.",
 "safe","tap-safe","UTC+5:30",
 "Rohtang Pass at 3,978 meters with snow even in summer, Solang Valley's paragliding and skiing, and Old Manali's backpacker cafés beside the Beas River — Manali is India's adventure playground in the Himalayas."),
("munnar","Munnar","India","COK","asia",10.09,77.06,
 ["nature","relaxation","photography","tea"],[9,10,11,12,1,2,3],"budget",
 ["Tea plantations","Eravikulam National Park","Nilgiri tahr","Mattupetty Dam"],
 "indian_highland",4,
 "Munnar is a small hill town; auto-rickshaws and taxis reach the surrounding tea estates and national park.",
 "safe","tap-safe","UTC+5:30",
 "Endless tea plantations rolling over misty hills in every direction — Munnar is Kerala's highland jewel, where you can tour tea factories, spot endangered Nilgiri tahr, and wake up in a plantation bungalow surrounded by green as far as you can see."),
("alleppey","Alleppey","India","COK","asia",9.49,76.34,
 ["nature","culture","food","relaxation"],[9,10,11,12,1,2,3],"budget",
 ["Houseboat cruises","Backwater canals","Coir villages","Snake boat races"],
 "indian_south_coastal",0,
 "Alleppey is the starting point for houseboat cruises; the town itself is flat and walkable, with canoe tours exploring narrower backwater channels.",
 "safe","bottled-only","UTC+5:30",
 "Float through Kerala's palm-fringed backwaters on a traditional houseboat — rice paddies slipping past, village life unfolding on the banks, and fresh fish curry served on banana leaves for dinner. Alleppey is India's most serene experience."),
("ranthambore","Ranthambore","India","JAI","asia",26.02,76.50,
 ["wildlife","nature","photography","adventure"],[10,11,12,1,2,3,4,5],"moderate",
 ["Bengal tigers","Ranthambore Fort","Safari drives","Wildlife photography"],
 "indian_tropical",-2,
 "Ranthambore town is small; the national park is accessed by safari jeep or canter, booked through lodges or online.",
 "safe","bottled-only","UTC+5:30",
 "India's most famous tiger reserve — Ranthambore's big cats are so confident they stroll past ancient fort ruins in broad daylight. A safari here offers the best chance in India to photograph a wild Bengal tiger in its element."),
("khajuraho","Khajuraho","India","HJR","asia",24.85,79.93,
 ["history","culture","art","photography"],[10,11,12,1,2,3],"budget",
 ["Erotic temple carvings","UNESCO temples","Light and sound show","Chandela dynasty"],
 "indian_tropical",-1,
 "Khajuraho is a small town; the Western Group of temples is walkable, and bicycle rickshaws reach the Eastern and Southern groups.",
 "safe","bottled-only","UTC+5:30",
 "Temple carvings so sensuous and detailed they've captivated visitors for a thousand years — Khajuraho's UNESCO-listed temples are India's most extraordinary sculptural achievement, celebrating life in all its forms with zero inhibition."),
("andaman-islands","Andaman Islands","India","IXZ","asia",11.62,92.73,
 ["beach","diving","nature","adventure"],[11,12,1,2,3,4,5],"moderate",
 ["Radhanagar Beach","Scuba diving","Cellular Jail","Bioluminescence"],
 "indian_tropical_island",0,
 "The Andamans are reached by flight to Port Blair; ferries and speedboats connect the islands, and a car or scooter helps on larger islands.",
 "safe","bottled-only","UTC+5:30",
 "Radhanagar Beach — consistently ranked Asia's best — turquoise water over coral reefs, bioluminescent plankton lighting up the night surf, and the haunting history of Cellular Jail. The Andamans are India's most stunning tropical escape."),
("aurangabad","Aurangabad","India","IXU","asia",19.88,75.32,
 ["history","culture","art"],[10,11,12,1,2,3],"budget",
 ["Ajanta Caves","Ellora Caves","Bibi Ka Maqbara","Daulatabad Fort"],
 "indian_tropical",0,
 "Aurangabad is the base for Ajanta and Ellora; the caves are 30km and 100km away respectively, reached by taxi or tour.",
 "safe","bottled-only","UTC+5:30",
 "Ajanta's 2,000-year-old painted caves and Ellora's rock-cut temples — including the mind-boggling Kailasa Temple carved from a single rock from the top down — are India's greatest ancient art. Aurangabad is the gateway to pure wonder."),
("pushkar","Pushkar","India","JAI","asia",26.49,74.55,
 ["culture","spirituality","food","photography"],[10,11,12,1,2,3],"budget",
 ["Pushkar Lake","Brahma Temple","Camel Fair","Rooftop cafés"],
 "indian_arid",-2,
 "Pushkar is a tiny town easily walked in 30 minutes; the lake, temple, and bazaar are all steps apart.",
 "safe","bottled-only","UTC+5:30",
 "A sacred lake ringed by 52 ghats and the world's only Brahma temple — Pushkar's annual camel fair draws 200,000 camels and their traders, and the rooftop cafés overlooking the lake at sunset are pure Rajasthani magic."),
("bangalore","Bangalore","India","BLR","asia",12.97,77.59,
 ["food","culture","nightlife","nature"],[10,11,12,1,2,3],"moderate",
 ["Craft beer capital","Lalbagh Gardens","Tech hub","South Indian cuisine"],
 "indian_tropical",-2,
 "Bangalore is a large, spread-out city; ride-hailing apps work well, and areas like MG Road, Indiranagar, and Koramangala are walkable neighborhoods.",
 "safe","tap-safe","UTC+5:30",
 "India's craft beer capital with more microbreweries than you can visit in a week, Lalbagh's 240-acre botanical garden, and South Indian breakfast — crispy dosas and filter coffee — that ruins you for all other breakfasts. Bangalore is India's most modern city with deep traditional roots."),
("chennai","Chennai","India","MAA","asia",13.08,80.27,
 ["culture","food","history","beach"],[11,12,1,2,3],"budget",
 ["Kapaleeshwarar Temple","Marina Beach","Chettinad cuisine","Bharatanatyam dance"],
 "indian_south_coastal",0,
 "Chennai has a suburban rail and metro system; auto-rickshaws are ubiquitous, and the Marina Beach promenade is walkable.",
 "safe","bottled-only","UTC+5:30",
 "Marina Beach stretching for 13 kilometers, Kapaleeshwarar Temple's towering gopuram painted in a thousand colors, and Chettinad cuisine so complex it uses 30+ spices in a single dish — Chennai is South India's cultural powerhouse, intense and unforgettable."),
]

def get_image_url(idx):
    return UNSPLASH_PLACEHOLDERS[idx % len(UNSPLASH_PLACEHOLDERS)]

def apply_temp_offset(weather, offset):
    if offset == 0:
        return weather
    return [dict(m, avgHighC=m["avgHighC"]+offset, avgLowC=m["avgLowC"]+offset) for m in weather]

def make_destination_json(d, idx):
    cost = COST[d[9]]
    return {
        "id": d[0], "city": d[1], "country": d[2], "airportCode": d[3],
        "region": d[4], "vibes": d[7], "bestMonths": d[8],
        "averageCost": cost[0],
        "dailyCosts": {"foodPerDay": cost[1], "activitiesPerDay": cost[2],
                       "transportPerDay": cost[3], "source": "claude", "lastUpdated": "2026-03-01"},
        "highlights": d[10], "imageUrl": get_image_url(idx),
        "latitude": d[5], "longitude": d[6]
    }

def make_facts_json(d):
    return {
        "destinationId": d[0], "city": d[1], "country": d[2],
        "transportAdvice": d[13], "safetyLevel": d[14], "waterSafety": d[15],
        "costLevel": d[9], "timeZone": d[16],
        "weather": apply_temp_offset(WEATHER[d[11]], d[12]),
        "_meta": {"dataVersion": "2026-Q1", "lastVerified": "2026-03-01",
                  "lastUpdated": "2026-03-01", "generatedBy": "script-v2",
                  "reviewStatus": "auto-generated"}
    }

def main():
    print(f"Processing {len(DESTS)} new India destinations...")

    # 1. Update destinations.json
    dest_path = os.path.join(BASE, "data", "destinations.json")
    with open(dest_path, "r", encoding="utf-8") as f:
        existing = json.load(f)
    existing_ids = {d["id"] for d in existing}

    new_dests = []
    for i, d in enumerate(DESTS):
        if d[0] in existing_ids:
            print(f"  SKIP: {d[0]}")
            continue
        new_dests.append(make_destination_json(d, i))

    existing.extend(new_dests)
    with open(dest_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    print(f"destinations.json: {len(existing)} total ({len(new_dests)} new)")

    # 2. Create destination-facts files
    facts_dir = os.path.join(BASE, "data", "destination-facts")
    created = 0
    for d in DESTS:
        if d[0] in existing_ids:
            continue
        with open(os.path.join(facts_dir, f"{d[0]}.json"), "w", encoding="utf-8") as f:
            json.dump(make_facts_json(d), f, indent=2, ensure_ascii=False)
        created += 1
    print(f"Created {created} destination-facts files")

    # 3. Insert into cityPitches.ts
    pitches_path = os.path.join(BASE, "lib", "flash", "cityPitches.ts")
    with open(pitches_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    insert_idx = None
    for i, line in enumerate(lines):
        if line.strip() == '};' and i > 100:
            insert_idx = i
            break

    if insert_idx:
        pitch_lines = ["\n  // ── India (additional 15) ────────────────────────────\n"]
        for d in DESTS:
            if d[0] in existing_ids:
                continue
            pitch = d[17].replace("'", "\\'")
            pitch_lines.append(f"  '{d[0]}':\n    '{pitch}',\n")
        lines = lines[:insert_idx] + pitch_lines + lines[insert_idx:]
        with open(pitches_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        print(f"Updated cityPitches.ts")

    # 4. Insert into destinationImages.ts
    images_path = os.path.join(BASE, "lib", "flash", "destinationImages.ts")
    with open(images_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    insert_idx = None
    for i, line in enumerate(lines):
        if line.strip() == '};' and i > 20:
            insert_idx = i
            break

    if insert_idx:
        img_lines = ["  // ── India (additional 15) ────────────────────────────\n"]
        for d in DESTS:
            if d[0] in existing_ids:
                continue
            img_lines.append(f"  '{d[0]}': generateDestinationImages('{d[0]}'),\n")
        lines = lines[:insert_idx] + img_lines + lines[insert_idx:]
        with open(images_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        print(f"Updated destinationImages.ts")

    print("Done!")

if __name__ == "__main__":
    main()
