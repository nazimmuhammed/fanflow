"""
build_knowledge_base.py
Reads stadium_data.json, converts each record into a plain-English sentence
("a document"), and stores it in ChromaDB so it can be searched by MEANING
later (not just exact keyword match). Run this once, and again anytime the
stadium data changes.
"""

import json
import os
import chromadb

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "stadium_data.json")

def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def build_documents(data):
    """
    Turn structured JSON into plain-English sentences.
    Why? Because the embedding model (which turns text into vectors) works
    best on natural language, not raw JSON keys/values.
    Each document also carries metadata so we can trace it back to source.
    """
    docs = []
    metadatas = []
    ids = []
    counter = 0

    # Gates
    for g in data["gates"]:
        text = (
            f"{g['name']} (Gate {g['id']}) is currently {g['status']} with "
            f"{g['congestion']} congestion. It is "
            f"{'wheelchair accessible' if g['accessible'] else 'not wheelchair accessible'}. "
            f"It serves seating sections {', '.join(g['nearestSections'])}."
        )
        docs.append(text)
        metadatas.append({"type": "gate", "gate_id": g["id"]})
        ids.append(f"gate_{counter}")
        counter += 1

    # Amenities
    for a in data["amenities"]:
        text = (
            f"{a['type'].replace('_',' ').title()} located at {a['location']}, "
            f"near Gate {a['gate']}. "
            f"{'This location is wheelchair accessible.' if a['accessible'] else 'This location is not wheelchair accessible.'}"
        )
        docs.append(text)
        metadatas.append({"type": "amenity", "amenity_type": a["type"], "gate": a["gate"]})
        ids.append(f"amenity_{counter}")
        counter += 1

    # Transit - shuttles
    for s in data["transit"]["shuttles"]:
        text = (
            f"{s['route']} departs near Gate {s['gate']} in {s['nextDeparture']}, "
            f"running {s['frequency']}."
        )
        docs.append(text)
        metadatas.append({"type": "shuttle", "gate": s["gate"]})
        ids.append(f"shuttle_{counter}")
        counter += 1

    # Transit - parking
    for p in data["transit"]["parking"]:
        spots = f", {p['spotsLeft']} spots left" if "spotsLeft" in p else ""
        text = (
            f"{p['lot']} is currently {p['status']}{spots}. "
            f"It's about a {p['walkTimeToGate']} walk to Gate {p['gate']}."
        )
        docs.append(text)
        metadatas.append({"type": "parking", "gate": p["gate"]})
        ids.append(f"parking_{counter}")
        counter += 1

    # Sustainability
    for w in data["sustainability"]["wasteStations"]:
        text = f"Waste sorting station {w['location']} accepts: {', '.join(w['types'])}."
        docs.append(text)
        metadatas.append({"type": "waste_station"})
        ids.append(f"waste_{counter}")
        counter += 1

    for init in data["sustainability"]["initiatives"]:
        docs.append(f"Sustainability initiative: {init}")
        metadatas.append({"type": "initiative"})
        ids.append(f"init_{counter}")
        counter += 1

    # FAQs
    for f in data["faqs"]:
        docs.append(f"Q: {f['q']} A: {f['a']}")
        metadatas.append({"type": "faq"})
        ids.append(f"faq_{counter}")
        counter += 1

    return docs, metadatas, ids

def main():
    data = load_data()
    docs, metadatas, ids = build_documents(data)

    # Persistent client = saves to disk in ./chroma_store, so you don't
    # need to rebuild every time you restart the server
    client = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), "chroma_store"))

    # Delete old collection if it exists (so re-running this script refreshes data)
    try:
        client.delete_collection("stadium_knowledge")
    except Exception:
        pass

    collection = client.create_collection("stadium_knowledge")

    # ChromaDB automatically embeds text using a default local model
    # (all-MiniLM-L6-v2) - no API key needed for this step
    collection.add(documents=docs, metadatas=metadatas, ids=ids)

    print(f"✅ Knowledge base built: {len(docs)} documents stored in ChromaDB.")

if __name__ == "__main__":
    main()