
const axios = require('axios');

async function testUpdate() {
    const api = axios.create({ baseURL: 'http://localhost:5001/api' });

    // 1. Create
    console.log("Creating athlete...");
    const created = await api.post('/athletes', {
        name: "Debug Hero",
        academy: "Debug Academy",
        belt: "White",
        weight: 80,
        gender: "Male",
        age: 25
    });
    const id = created.data._id;
    console.log("Created ID:", id);

    // 2. Update
    console.log("Updating athlete...");
    const form = {
        name: "Debug Hero Updated",
        academy: "Debug Academy",
        belt: "White",
        weight: 85,
        gender: "Male",
        age: 26
    };

    // Simulate exactly what AthleteManager does:
    const updated = await api.put(`/athletes/${id}`, form);
    console.log("Update response:", updated.data);

    // 3. Verify
    const verify = await api.get(`/athletes/${id}`);
    console.log("Verify data:", verify.data);

    if (verify.data.name !== "Debug Hero Updated") {
        console.error("FAIL: Name not updated");
    } else {
        console.log("SUCCESS: Name updated");
    }
}

testUpdate().catch(console.error);
