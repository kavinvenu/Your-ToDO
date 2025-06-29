const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smarttasker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testProfileUpdate() {
  try {
    console.log('🔍 Testing profile update functionality...\n');
    
    // Find a user to test with
    const user = await User.findOne({});
    
    if (!user) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }
    
    console.log('🔍 Found user for testing:');
    console.log(`  ID: ${user._id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Bio: ${user.bio || 'No bio'}`);
    console.log(`  Location: ${user.location || 'No location'}`);
    console.log(`  Website: ${user.website || 'No website'}`);
    console.log(`  OAuth Provider: ${user.oauthProvider}`);
    console.log('');
    
    // Test updating the user
    const testUpdates = {
      name: 'Test Updated Name',
      bio: 'This is a test bio update',
      location: 'Test Location',
      website: 'https://test-website.com'
    };
    
    console.log('🔍 Testing updates:', testUpdates);
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: testUpdates },
      { new: true, runValidators: true }
    ).select('-password');
    
    console.log('✅ User updated successfully:');
    console.log(`  Name: ${updatedUser.name}`);
    console.log(`  Bio: ${updatedUser.bio}`);
    console.log(`  Location: ${updatedUser.location}`);
    console.log(`  Website: ${updatedUser.website}`);
    console.log('');
    
    // Reset the user back to original state
    const resetUpdates = {
      name: user.name,
      bio: user.bio,
      location: user.location,
      website: user.website
    };
    
    await User.findByIdAndUpdate(
      user._id,
      { $set: resetUpdates },
      { new: true, runValidators: true }
    );
    
    console.log('✅ User reset to original state');
    
  } catch (error) {
    console.error('❌ Error testing profile update:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testProfileUpdate(); 