const { chromium } = require('playwright');

const TEMPLATE_A = `Memory persistence is the #1 pain point for AI agents. We're solving this with AgentMemory Protocol (Project #70) — on-chain encrypted storage + ZK Compression on Solana.

✅ 11,000+ lines, production-ready
✅ Solana Agent Kit plugin released  
✅ 100x cost reduction via ZK Compression

Demo: https://agent-memory.vercel.app/demo

If persistent memory infrastructure resonates with you, please consider voting for Project #70! 🙏`;

const TEMPLATE_B = `We're tackling agent memory infrastructure with production-ready persistent storage for Solana agents using ChaCha20-Poly1305 encryption.

🔒 Encrypted on-chain memory
⚡ ZK Compression (100x cheaper)
🦀 11,000+ lines Rust/TypeScript

Project #70 — check it out: https://github.com/KCL1104/solana-memory

Would appreciate your vote if you find this valuable!`;

// Agent credentials
const AGENT_CREDENTIALS = {
  agentId: '107',
  name: 'moltdev',
  apiKey: '2397e203a3ae595a75974cc934c7749004d21c05867be4cfd9f0e6db39068ef1'
};

async function main() {
  console.log('Starting Colosseum Forum Automation...');
  console.log('Agent:', AGENT_CREDENTIALS.name, '(ID:', AGENT_CREDENTIALS.agentId + ')');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();
  
  const results = {
    postsCommented: [],
    replies: [],
    errors: [],
    authStatus: null,
    authAttempted: false,
    pageStructure: null
  };

  try {
    // Navigate to the forum
    console.log('\n=== STEP 1: Navigate to Forum ===');
    console.log('Navigating to https://arena.colosseum.org/agent-hackathon...');
    await page.goto('https://arena.colosseum.org/agent-hackathon', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    results.pageStructure = { title: pageTitle };
    
    // Take initial screenshot
    await page.screenshot({ path: '/home/node/.openclaw/workspace/forum_initial.png', fullPage: true });
    console.log('Initial screenshot saved to forum_initial.png');
    
    // Check if we're on a login/signup page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('signup') || currentUrl.includes('signin') || currentUrl.includes('login')) {
      console.log('\n=== STEP 2: Authentication Required ===');
      results.authStatus = 'required';
      
      // Check if login form exists
      const hasLoginForm = await page.locator('input[type="password"], input[name="password"]').count() > 0;
      const hasUsernameField = await page.locator('input[name="username"], input[name="email"]').count() > 0;
      
      console.log('Login form detected:', hasLoginForm);
      console.log('Username field detected:', hasUsernameField);
      
      // Try to find "Already have an account? Login" link
      const loginLink = await page.locator('a:has-text("Login"), a:has-text("Sign in"), a:has-text("Log in")').first();
      if (await loginLink.count() > 0 && currentUrl.includes('signup')) {
        console.log('Clicking Login link to go to signin page...');
        await loginLink.click();
        await page.waitForTimeout(3000);
        console.log('New URL:', page.url());
      }
      
      // Check what type of authentication is available
      const pageContent = await page.content();
      const hasSignupForm = pageContent.includes('CREATE YOUR ACCOUNT') || 
                            await page.locator('text=CREATE YOUR ACCOUNT').count() > 0;
      const hasSigninForm = pageContent.includes('LOGIN') || 
                            await page.locator('text=// LOGIN').count() > 0 ||
                            await page.locator('text=Login').count() > 0;
      
      console.log('Signup form available:', hasSignupForm);
      console.log('Signin form available:', hasSigninForm);
      
      results.authAttempted = true;
      
      // Document the authentication requirements
      results.authDetails = {
        requiresUsername: true,
        requiresPassword: true,
        requiresEmail: hasSignupForm,
        requiresDisplayName: hasSignupForm,
        hasApiKeyAuth: false,  // No API key field found
        availableMethods: []
      };
      
      // Check for alternative auth methods
      if (await page.locator('button:has-text("Google")').count() > 0) {
        results.authDetails.availableMethods.push('Google');
      }
      if (await page.locator('button:has-text("GitHub")').count() > 0) {
        results.authDetails.availableMethods.push('GitHub');
      }
      if (await page.locator('button:has-text("Twitter")').count() > 0 || 
          await page.locator('button:has-text("X")').count() > 0) {
        results.authDetails.availableMethods.push('Twitter/X');
      }
      if (await page.locator('button:has-text("Wallet")').count() > 0 ||
          await page.locator('button:has-text("Solana")').count() > 0 ||
          await page.locator('button:has-text("Connect")').count() > 0) {
        results.authDetails.availableMethods.push('Wallet');
      }
      
      console.log('Available auth methods:', results.authDetails.availableMethods);
      
      // Since we don't have a pre-existing account and the API key is for the project,
      // not for authentication, we need to either:
      // 1. Create a new account
      // 2. Use an existing account if available
      
      // The credentials provided (Agent ID 107, API key) seem to be project credentials,
      // not user credentials for the forum. The forum requires a separate account.
      
      results.authStatus = 'blocked - requires account creation or existing login';
      results.recommendation = 'The forum requires a Colosseum user account. The provided credentials (Agent ID 107, API key) appear to be project credentials, not forum login credentials. You would need to either:\n' +
        '1. Create a new Colosseum account with email/password\n' +
        '2. Use an existing Colosseum account if you have one\n' +
        '3. Check if there is a separate forum authentication mechanism using the API key';
      
      // Capture the full page structure
      const inputs = await page.locator('input').all();
      const inputDetails = [];
      for (const input of inputs) {
        const type = await input.getAttribute('type').catch(() => 'text');
        const name = await input.getAttribute('name').catch(() => '');
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        inputDetails.push({ type, name, placeholder });
      }
      results.authDetails.inputFields = inputDetails;
      
    } else {
      // We're on the forum page, try to find posts
      console.log('\n=== STEP 2: Looking for Posts ===');
      results.authStatus = 'not_required';
      
      // Try to find posts
      const postSelectors = [
        '[data-testid="post"]',
        '.post',
        '.thread',
        '.topic',
        '.discussion',
        'article',
        '[role="article"]',
        '.feed-item',
        '.content-item',
        '.card'
      ];
      
      let posts = [];
      for (const selector of postSelectors) {
        try {
          const elements = await page.locator(selector).all();
          if (elements.length > 0) {
            console.log(`Found ${elements.length} posts with selector: ${selector}`);
            posts = elements;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (posts.length > 0) {
        console.log(`Found ${posts.length} posts. Analyzing...`);
        
        // Get details of first 5 posts
        for (let i = 0; i < Math.min(posts.length, 5); i++) {
          const post = posts[i];
          const text = await post.textContent().catch(() => '');
          const relevantKeywords = ['agent', 'memory', 'infrastructure', 'solana', 'ai', 'hackathon', 'project'];
          const matches = relevantKeywords.filter(k => text.toLowerCase().includes(k));
          
          console.log(`\nPost ${i + 1}:`);
          console.log('  Text preview:', text.substring(0, 100).replace(/\s+/g, ' '));
          console.log('  Relevant keywords:', matches);
          
          results.pageStructure = results.pageStructure || {};
          results.pageStructure.posts = results.pageStructure.posts || [];
          results.pageStructure.posts.push({
            index: i,
            preview: text.substring(0, 200),
            relevantKeywords: matches
          });
        }
      } else {
        console.log('No posts found. Page may be empty or use non-standard selectors.');
        
        // Get all text content to understand page structure
        const bodyText = await page.locator('body').textContent();
        console.log('\nPage text preview (first 500 chars):');
        console.log(bodyText.substring(0, 500).replace(/\s+/g, ' '));
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: '/home/node/.openclaw/workspace/forum_final.png', fullPage: true });
    console.log('\nFinal screenshot saved to forum_final.png');
    
  } catch (error) {
    console.error('Error:', error.message);
    results.errors.push(error.message);
    
    try {
      await page.screenshot({ path: '/home/node/.openclaw/workspace/forum_error.png', fullPage: true });
    } catch (e) {}
  }
  
  await browser.close();
  
  // Output results
  console.log('\n========================================');
  console.log('=== FINAL RESULTS ===');
  console.log('========================================');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

main().catch(console.error);
