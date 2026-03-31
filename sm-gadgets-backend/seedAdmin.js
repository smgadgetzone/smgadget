const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

dotenv.config();

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });

const seedAdmin = async () => {
    try {
        const adminEmail = "admin@mahalakshmigallery.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        const hashedPassword = await bcrypt.hash("admin123", 10);

        if (existingAdmin) {
            console.log("Admin user exists, updating password...");
            existingAdmin.password = hashedPassword;
            existingAdmin.isAdmin = true;
            await existingAdmin.save();
            console.log("Admin password updated to 'admin123'");
            process.exit();
        }
        const adminUser = new User({
            name: "Admin",
            email: adminEmail,
            password: hashedPassword,
            isAdmin: true,
        });

        await adminUser.save();
        console.log("Admin user created successfully");
        console.log("Email: admin@mahalakshmigallery.com");
        console.log("Password: admin123");
        process.exit();
    } catch (error) {
        console.error("Error creating admin user:", error);
        process.exit(1);
    }
};

seedAdmin();
