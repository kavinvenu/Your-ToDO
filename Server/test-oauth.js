const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smarttasker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testOAuthData() {
  try {
    console.log('🔍 Testing OAuth data storage...\n');
    
    // Find all users with OAuth data
    const oauthUsers = await User.find({
      $or: [
        { oauthProvider: { $ne: 'local' } },
        { 'oauthData.google': { $exists: true } },
        { 'oauthData.github': { $exists: true } }
      ]
    });
    
    console.log(`Found ${oauthUsers.length} OAuth users:\n`);
    
    oauthUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  OAuth Provider: ${user.oauthProvider}`);
      console.log(`  Avatar: ${user.avatar}`);
      console.log(`  Bio: ${user.bio || 'N/A'}`);
      console.log(`  Location: ${user.location || 'N/A'}`);
      
      if (user.oauthData?.google) {
        console.log(`  Google OAuth Data:`);
        console.log(`    ID: ${user.oauthData.google.id}`);
        console.log(`    Email: ${user.oauthData.google.email}`);
        console.log(`    Name: ${user.oauthData.google.name}`);
        console.log(`    Picture: ${user.oauthData.google.picture}`);
        console.log(`    Verified: ${user.oauthData.google.verified_email}`);
      }
      
      if (user.oauthData?.github) {
        console.log(`  GitHub OAuth Data:`);
        console.log(`    ID: ${user.oauthData.github.id}`);
        console.log(`    Login: ${user.oauthData.github.login}`);
        console.log(`    Email: ${user.oauthData.github.email}`);
        console.log(`    Name: ${user.oauthData.github.name}`);
        console.log(`    Avatar: ${user.oauthData.github.avatar_url}`);
        console.log(`    Bio: ${user.oauthData.github.bio || 'N/A'}`);
        console.log(`    Location: ${user.oauthData.github.location || 'N/A'}`);
      }
      
      console.log(`  Last Login: ${user.lastLogin}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Updated: ${user.updatedAt}`);
      console.log('---\n');
    });
    
    if (oauthUsers.length === 0) {
      console.log('❌ No OAuth users found. Try logging in with Google or GitHub first.');
    }
    
  } catch (error) {
    console.error('❌ Error testing OAuth data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testOAuthData(); 