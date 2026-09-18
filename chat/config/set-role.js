const path = require('path');
const mongoose = require('mongoose');
const { User } = require('@librechat/data-schemas').createModels(mongoose);
const { SystemRoles } = require('librechat-data-provider');
require('module-alias')({ base: path.resolve(__dirname, '..', 'api') });
const { askQuestion, silentExit, coloredConsole } = require('./helpers');
const connect = require('./connect');

(async () => {
  try {
    await connect();

    coloredConsole.purple('----------------------------------');
    coloredConsole.purple('TerraMind User Role Management');
    coloredConsole.purple('----------------------------------');

    let email = process.argv[2];
    let newRole = process.argv[3];

    if (!email || !newRole) {
      coloredConsole.orange('Usage: npm run set-role <email> <ADMIN|USER>');
      coloredConsole.orange('Prompting for missing arguments:');
    }

    if (!email) {
      email = await askQuestion('Enter User Email:');
    }

    email = (email || '').trim().toLowerCase();

    if (!email.includes('@')) {
      coloredConsole.red('Error: Invalid email address!');
      silentExit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      coloredConsole.red(`Error: No user with email "${email}" was found!`);
      silentExit(1);
    }

    coloredConsole.green(`Found user: ${user.name || user.username || user.email} (Current Role: ${user.role || 'USER'})`);

    if (!newRole) {
      const roleChoice = await askQuestion('Enter new role (1 for ADMIN, 2 for USER) [Default: ADMIN]:');
      const cleanChoice = (roleChoice || '').trim().toUpperCase();
      if (cleanChoice === '2' || cleanChoice === 'USER') {
        newRole = SystemRoles.USER;
      } else {
        newRole = SystemRoles.ADMIN;
      }
    } else {
      newRole = newRole.trim().toUpperCase();
      if (newRole !== SystemRoles.ADMIN && newRole !== SystemRoles.USER) {
        coloredConsole.red(`Error: Invalid role "${newRole}". Must be ADMIN or USER.`);
        silentExit(1);
      }
    }

    user.role = newRole;
    await user.save();

    coloredConsole.green(`\n[OK] Successfully updated ${email} to role: ${newRole}`);
    coloredConsole.purple('----------------------------------\n');
    silentExit(0);
  } catch (err) {
    console.error('Error updating user role:', err);
    silentExit(1);
  }
})();
