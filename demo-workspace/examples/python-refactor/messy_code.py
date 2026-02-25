# This code works but needs refactoring - use AI to improve it!

def calc(d):
    r = []
    for i in range(len(d)):
        if d[i]["type"] == "A":
            x = d[i]["value"] * 1.19
            if x > 100:
                x = x * 0.9
            r.append({"name": d[i]["name"], "total": round(x, 2), "status": "premium"})
        elif d[i]["type"] == "B":
            x = d[i]["value"] * 1.19
            r.append({"name": d[i]["name"], "total": round(x, 2), "status": "standard"})
        else:
            r.append({"name": d[i]["name"], "total": 0, "status": "unknown"})
    return r


data = [
    {"name": "Widget", "type": "A", "value": 150},
    {"name": "Gadget", "type": "B", "value": 75},
    {"name": "Thingy", "type": "C", "value": 50},
    {"name": "Doohickey", "type": "A", "value": 200},
]

result = calc(data)
for item in result:
    print(f"{item['name']}: {item['total']}EUR ({item['status']})")
