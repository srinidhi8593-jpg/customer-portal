const bcrypt = require('bcryptjs');

async function main() {
    const isMatch = await bcrypt.compare('admin123', '$2b$10$R2z1WRirGdaJilS9MewZrOKQ52Kz65RgPj2FNmBIaM5d1z/3igjui');
    console.log("MATCH:", isMatch);
}
main();
