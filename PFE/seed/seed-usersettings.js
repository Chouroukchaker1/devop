const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

const uri = "mongodb://admin:admin123@mongodb:27017/Nouvelair?authSource=admin";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ Connexion MongoDB OK");

    const db = client.db();

    // 1️⃣ Hash du mot de passe
    const hashedPassword = await bcrypt.hash("12345678", 10);

    // 2️⃣ Insertion de l'utilisateur admin
    const userResult = await db.collection("users").insertOne({
      username: "admin",
      password: hashedPassword,
      email: "admin@example.com",
        role: "admin",   
        isActive: true

    });

    console.log("👤 Utilisateur inséré :", userResult.insertedId);

    // 3️⃣ Insertion du usersettings lié à cet utilisateur
    const settingsResult = await db.collection("usersettings").insertOne({
      userId: userResult.insertedId,
      schedulerConfig: {
        enabled: true,
        hours: [9],
        days: [20],
        months: [5],
        weekdays: [1],
        startDate: null
      }
    });

    console.log("⚙️ Settings insérés :", settingsResult.insertedId);
  } catch (error) {
    console.error("❌ Erreur :", error.message);
  } finally {
    await client.close();
  }
}

run();
