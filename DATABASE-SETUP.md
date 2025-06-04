# HotBoxes Database Setup Guide

## 🚀 Quick Setup Instructions

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `hotboxes`
   - **Database Password**: (generate a strong password - save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to initialize (~2 minutes)

### Step 2: Run Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** (this will take ~30 seconds)
5. Verify success - you should see "Success. No rows returned" message

### Step 3: Get Your Environment Variables
1. In Supabase dashboard, go to **Settings → API**
2. Copy these values:

```bash
# Add these to your .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Create Environment File
Create `.env.local` in your project root:

```bash
# HotBoxes Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Add your site URL for redirects
NEXT_PUBLIC_URL=http://localhost:3000
```

### Step 5: Test Your Setup
```bash
npm run dev
```

Visit `http://localhost:3000` and:
1. ✅ Sign up for a new account
2. ✅ Check that your profile is created automatically
3. ✅ Try purchasing HotCoins (simulated)
4. ✅ Browse the games page

## 🧪 Testing Your Database

### Verify Tables Were Created
In Supabase **Table Editor**, you should see:
- ✅ `profiles` (with sample admin and test user)
- ✅ `games` (with sample NFL game)
- ✅ `boxes` (100 boxes for the sample game)
- ✅ `hotcoin_transactions` (empty)

### Test Admin Access
1. In **Table Editor → profiles**
2. Find your user account
3. Set `is_admin = true`
4. Save the change
5. Refresh your app - you should see "Admin" tab in navigation

### Sample Admin Account
If you want to use the pre-created admin account:
- **Email**: `admin@hotboxes.com`
- **Password**: Create this user in **Authentication → Users**
- **ID**: `00000000-0000-0000-0000-000000000001`

## 🔧 Database Features Included

### Automatic Features
- ✅ **User Profile Creation**: Automatically creates profile when user signs up
- ✅ **Row Level Security**: Users can only see their own data
- ✅ **Admin Permissions**: Admins can see/edit everything
- ✅ **Data Validation**: Entry fees must be positive, grid coordinates 0-9
- ✅ **Audit Trail**: All transactions logged with timestamps

### Helper Functions
- ✅ `create_game_boxes(game_id)`: Automatically creates 100 boxes for a game
- ✅ `handle_new_user()`: Creates profile when user signs up
- ✅ `handle_updated_at()`: Updates timestamps on record changes

### Performance Optimizations
- ✅ **Indexes**: On frequently queried columns
- ✅ **Constraints**: Data integrity checks
- ✅ **Efficient Queries**: Optimized for real-time updates

## 🐛 Troubleshooting

### Common Issues

**"relation does not exist" error**
- Make sure you ran the full SQL schema
- Check that all tables appear in Table Editor

**"permission denied" error**
- Verify RLS policies are created
- Check user is authenticated properly

**"function does not exist" error**
- Ensure all functions were created
- Check SQL Editor for any error messages

**Environment variables not working**
- Verify `.env.local` file is in project root
- Restart your dev server after adding variables
- Check for typos in variable names

### Getting Help
1. Check Supabase logs in **Logs → Database**
2. Test queries in **SQL Editor**
3. Verify authentication in **Auth → Users**

## 🎯 Next Steps After Database Setup

1. **Test Complete User Flow**:
   - Sign up → Buy HotCoins → Join Game → Win Prize

2. **Create Real Games**:
   - Use admin interface to add NFL/NBA games
   - Test number assignment and scoring

3. **Set Up Production**:
   - Deploy to Vercel/Netlify
   - Set up automated cron jobs
   - Add real payment processing

---

**🎉 Database Ready!** Your HotBoxes platform now has a fully configured, production-ready database with sample data for testing.