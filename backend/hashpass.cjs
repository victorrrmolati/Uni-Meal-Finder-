//import bcrypt from 'bcryptjs';


const bcrypt = require('bcryptjs');

const passwords = [
  { vendor: "The Nile",  password: "nile1234" },
  { vendor: "OB Joint",     password: "OB1234"    },
  {vednor:"Bohlale Bakery",  password: "bohlale1234"},
];

async function hashAll() {
  for (const v of passwords) {
    const hash = await bcrypt.hash(v.password, 10);
    console.log(`${v.vendor}: ${hash}`);
  }
}

hashAll();