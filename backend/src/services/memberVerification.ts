import puppeteer, { Browser, Page } from 'puppeteer';

const KAPPA_LOGIN_URL = process.env.KAPPA_LOGIN_URL || 'https://members.kappaalphapsi1911.com/s/login/';
const KAPPA_USERNAME = process.env.KAPPA_USERNAME || '';
const KAPPA_PASSWORD = process.env.KAPPA_PASSWORD || '';

export interface MemberSearchResult {
  found: boolean;
  nameMatch: boolean;
  membershipNumberMatch: boolean;
  details?: {
    name?: string;
    membershipNumber?: string;
    chapter?: string;
  };
  error?: string;
}

/**
 * Record user interactions for debugging
 */
export async function recordManualLogin(page: Page): Promise<void> {
  console.log('\n🎬 RECORDING MODE: Please manually log in...');
  console.log('   1. The browser will stay open');
  console.log('   2. Wait a few seconds for the form to load (if it\'s dynamic)');
  console.log('   3. Manually fill in the username and password fields');
  console.log('   4. Click the login button');
  console.log('   5. Wait for the page to load after login');
  console.log('   6. Press Enter in this terminal when you\'re done\n');
  
  // First, show what elements are available BEFORE login
  console.log('📋 BEFORE LOGIN - Available elements:');
  await debugFormElements(page);
  
  // Try to find and access iframes BEFORE login
  console.log('\n🔍 Checking for iframes with login forms...\n');
  let iframes = await page.$$('iframe');
  
  if (iframes.length > 0) {
    for (let i = 0; i < iframes.length; i++) {
      try {
        const frame = await iframes[i].contentFrame();
        if (frame) {
          console.log(`✅ Iframe ${i + 1}: Accessible! Checking for form elements...`);
          
          // Try to find inputs in this iframe
          const iframeInputs = await frame.$$eval('input', (elements) => 
            elements.map((el: any) => ({
              type: el.type,
              name: el.name,
              id: el.id,
              placeholder: el.placeholder,
              className: el.className,
              selector: el.id ? `#${el.id}` : 
                        el.name ? `[name="${el.name}"]` :
                        el.className ? `.${el.className.split(' ')[0]}` :
                        `input[type="${el.type}"]`,
            }))
          );
          
          if (iframeInputs.length > 0) {
            console.log(`   Found ${iframeInputs.length} input(s) in iframe ${i + 1}:`);
            iframeInputs.forEach((input, idx) => {
              console.log(`     ${idx + 1}. Type: ${input.type}, Placeholder: ${input.placeholder || '(none)'}`);
              console.log(`        Selector: ${input.selector}`);
              console.log(`        ID: ${input.id || '(none)'}, Name: ${input.name || '(none)'}`);
            });
            console.log(`\n💡 The login form is in iframe ${i + 1}! We'll need to switch to this frame.\n`);
          }
        }
      } catch (e: any) {
        console.log(`   Iframe ${i + 1}: Cannot access - ${e.message}`);
        console.log(`   This might be a cross-origin iframe (Salesforce, etc.)\n`);
      }
    }
  }
  
  console.log('⏳ Waiting for you to complete login...');
  console.log('   (The form may be in an iframe or load dynamically - check the browser)');
  console.log('   💡 TIP: Right-click the username field → Inspect to see its selector');
  console.log('   Press Enter in this terminal when you\'re done\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  await new Promise<void>((resolve) => {
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
  
  // Try to detect which fields were used by checking for filled values
  console.log('\n📹 Analyzing what you did...\n');
  
  // Check all frames (main page + iframes)
  const frames = [page];
  iframes = await page.$$('iframe');
  for (const iframe of iframes) {
    try {
      const frame = await iframe.contentFrame();
      if (frame) frames.push(frame);
    } catch (e) {
      // Cross-origin iframe, skip
    }
  }
  
  let allInputs: any[] = [];
  for (let i = 0; i < frames.length; i++) {
    try {
      const frameInputs = await frames[i].$$eval('input', (elements) => 
        elements.map((el: any) => ({
          frame: i === 0 ? 'main' : `iframe-${i}`,
          type: el.type,
          value: el.value ? '***' : '', // Don't show actual password
          hasValue: !!el.value,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          className: el.className,
          selector: el.id ? `#${el.id}` : 
                    el.name ? `[name="${el.name}"]` :
                    el.className ? `.${el.className.split(' ')[0]}` :
                    `input[type="${el.type}"]`,
        }))
      );
      allInputs = allInputs.concat(frameInputs);
    } catch (e) {
      // Can't access this frame
    }
  }
  
  console.log(`📝 ALL INPUT FIELDS AFTER YOUR INTERACTION (${allInputs.length} total):`);
  if (allInputs.length === 0) {
    console.log('  ⚠️  No inputs found! They may be in a cross-origin iframe.');
  } else {
    allInputs.forEach((input) => {
      console.log(`  - Frame: ${input.frame}`);
      console.log(`    Type: ${input.type}, Has Value: ${input.hasValue ? 'YES ⭐' : 'NO'}`);
      console.log(`    Placeholder: ${input.placeholder || '(none)'}`);
      console.log(`    Selector: ${input.selector}`);
      console.log(`    ID: ${input.id || '(none)'}, Name: ${input.name || '(none)'}`);
      console.log('');
    });
  }
  
  // Check current URL to see if login succeeded
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  if (!currentUrl.includes('/login') && !currentUrl.includes('/s/login')) {
    console.log('✅ Looks like login succeeded! (URL changed from login page)');
  } else {
    console.log('⚠️  Still on login page - login may have failed');
  }
  
  console.log('\n💡 NEXT STEPS:');
  console.log('   Since we couldn\'t detect the fields automatically, please:');
  console.log('   1. Open the browser DevTools (F12 or Cmd+Option+I)');
  console.log('   2. Go back to the login page (if you closed it)');
  console.log('   3. Right-click the USERNAME field → Inspect');
  console.log('   4. In the Elements panel, find the <input> tag');
  console.log('   5. Note the ID, name, or class attribute');
  console.log('   6. Do the same for the PASSWORD field');
  console.log('   7. Do the same for the LOGIN button');
  console.log('   8. Share those selectors with me (e.g., #username, [name="password"], .login-btn)');
  console.log('\n   OR if the form is in an iframe:');
  console.log('   - Check the iframe info shown above');
  console.log('   - We\'ll need to switch to that iframe before interacting with the form\n');
}

/**
 * Initialize a browser instance for member verification
 * @param headless - Whether to run in headless mode (default: true)
 */
export async function createBrowser(headless: boolean = true): Promise<Browser> {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ];

  // Only add these args in headless mode
  if (headless) {
    args.push('--disable-accelerated-2d-canvas', '--disable-gpu');
  }

  return await puppeteer.launch({
    headless: headless ? 'new' : false,
    args,
    defaultViewport: headless ? undefined : { width: 1280, height: 720 },
  });
}

/**
 * Helper: Wait for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debug: Log all form elements on the page
 */
async function debugFormElements(page: Page): Promise<void> {
  console.log('\n🔍 DEBUGGING: Analyzing form elements on the page...\n');
  
  // Wait a bit for dynamic content to load
  await delay(2000);
  
  // Check for iframes
  const iframes = await page.$$('iframe');
  console.log(`🔲 Found ${iframes.length} iframe(s)`);
  
  if (iframes.length > 0) {
    for (let i = 0; i < iframes.length; i++) {
      try {
        const frame = await iframes[i].contentFrame();
        if (frame) {
          console.log(`  Iframe ${i + 1}: Has content frame`);
          const iframeInputs = await frame.$$eval('input', (elements) => 
            elements.map((el: any) => ({
              type: el.type,
              name: el.name,
              id: el.id,
              placeholder: el.placeholder,
            }))
          );
          console.log(`    Inputs in iframe: ${iframeInputs.length}`);
        }
      } catch (e) {
        console.log(`  Iframe ${i + 1}: Cannot access (may be cross-origin)`);
      }
    }
  }
  
  // Get all inputs (wait a bit more for dynamic loading)
  await delay(1000);
  const inputs = await page.$$eval('input', (elements) => 
    elements.map((el: any) => ({
      type: el.type,
      name: el.name,
      id: el.id,
      placeholder: el.placeholder,
      className: el.className,
      value: el.value ? '***' : '',
      hasValue: !!el.value,
      selector: el.id ? `#${el.id}` : 
                el.name ? `[name="${el.name}"]` :
                el.className ? `.${el.className.split(' ')[0]}` :
                `input[type="${el.type}"]`,
    }))
  );
  
  console.log(`\n📝 INPUT FIELDS FOUND (${inputs.length} total):`);
  if (inputs.length === 0) {
    console.log('  ⚠️  No inputs found! The form may be dynamically loaded.');
    console.log('  💡 Try waiting a few seconds and check the browser manually.');
  } else {
    inputs.forEach((input, index) => {
      console.log(`  ${index + 1}. Type: ${input.type || 'text'}`);
      console.log(`     Placeholder: ${input.placeholder || '(none)'}`);
      console.log(`     Name: ${input.name || '(none)'}`);
      console.log(`     ID: ${input.id || '(none)'}`);
      console.log(`     Class: ${input.className || '(none)'}`);
      console.log(`     Has Value: ${input.hasValue ? 'YES' : 'NO'}`);
      console.log(`     Selector: ${input.selector}`);
      console.log('');
    });
  }
  
  // Get all buttons
  const buttons = await page.$$eval('button, input[type="submit"]', (elements) => 
    elements.map((el: any) => ({
      type: el.type,
      tagName: el.tagName,
      text: el.textContent?.trim() || el.value?.trim() || '',
      id: el.id,
      className: el.className,
      selector: el.id ? `#${el.id}` : 
                el.className ? `.${el.className.split(' ')[0]}` :
                `${el.tagName.toLowerCase()}`,
    }))
  );
  
  console.log(`🔘 BUTTONS FOUND (${buttons.length} total):`);
  if (buttons.length === 0) {
    console.log('  ⚠️  No buttons found!');
  } else {
    buttons.forEach((button, index) => {
      console.log(`  ${index + 1}. Text: "${button.text}"`);
      console.log(`     Type: ${button.type || 'button'}`);
      console.log(`     Tag: ${button.tagName}`);
      console.log(`     ID: ${button.id || '(none)'}`);
      console.log(`     Class: ${button.className || '(none)'}`);
      console.log(`     Selector: ${button.selector}`);
      console.log('');
    });
  }
  
  // Get page HTML structure around form
  const formInfo = await page.evaluate(() => {
    const form = document.querySelector('form');
    const allForms = document.querySelectorAll('form');
    return {
      formCount: allForms.length,
      formHTML: form ? form.outerHTML.substring(0, 2000) : 'No form element found',
      bodyHTML: document.body.innerHTML.substring(0, 1000),
    };
  });
  
  console.log(`📄 FORMS FOUND: ${formInfo.formCount}`);
  console.log('📄 FORM HTML (first 2000 chars):');
  console.log(formInfo.formHTML);
  console.log('\n');
  
  // Check for Salesforce Community login (common pattern)
  const isSalesforce = await page.evaluate(() => {
    return window.location.href.includes('salesforce.com') || 
           document.body.innerHTML.includes('salesforce') ||
           document.querySelector('[id*="salesforce"], [class*="salesforce"]') !== null;
  });
  
  if (isSalesforce) {
    console.log('🔍 Detected: This appears to be a Salesforce Community login page');
    console.log('   Salesforce forms are often dynamically loaded');
    console.log('   Try waiting longer or check for specific Salesforce selectors\n');
  }
}

/**
 * Login to the Kappa Alpha Psi member portal
 */
export async function loginToKappaPortal(page: Page, debugMode: boolean = false): Promise<boolean> {
  try {
    console.log(`Navigating to login page: ${KAPPA_LOGIN_URL}`);
    await page.goto(KAPPA_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait longer for dynamic content (Salesforce and similar platforms load forms dynamically)
    await delay(3000);
    
    // Check for iframes first (common with Salesforce Community pages)
    const iframes = await page.$$('iframe');
    let loginFrame: any = null;
    
    if (iframes.length > 0) {
      console.log(`Found ${iframes.length} iframe(s) - checking for login form...`);
      for (let i = 0; i < iframes.length; i++) {
        try {
          const frame = await iframes[i].contentFrame();
          if (frame) {
            // Check if this iframe has login inputs
            const frameInputs = await frame.$$('input[type="text"], input[type="email"], input[type="password"]');
            if (frameInputs.length >= 2) {
              console.log(`✅ Found login form in iframe ${i + 1}!`);
              loginFrame = frame;
              break;
            }
          }
        } catch (e) {
          // Cross-origin iframe, continue
        }
      }
    }
    
    // Use the frame if we found one, otherwise use main page
    const targetPage = loginFrame || page;
    
    console.log(`🔍 Looking for login form in ${loginFrame ? 'iframe' : 'main page'}...`);
    
    // Try waiting for the specific username field first (most reliable)
    try {
      await targetPage.waitForSelector('#username', { timeout: 10000 });
      console.log('✅ Found #username field');
    } catch (e) {
      console.log('⚠️  #username not found, trying other selectors...');
      // Try waiting for common login form indicators (in main page or iframe)
      try {
        await targetPage.waitForSelector('input[type="text"], input[type="email"], input[type="password"], input:not([type="hidden"])', { timeout: 10000 });
        console.log('✅ Found some input fields');
      } catch (e2) {
        console.log('⚠️  No input fields found after waiting - form may be dynamically loaded');
        // Take a screenshot to see what's on the page
        await page.screenshot({ path: 'login-page-debug.png', fullPage: true });
        console.log('📸 Screenshot saved to login-page-debug.png');
      }
    }

    // Debug mode: Log all form elements
    if (debugMode) {
      await debugFormElements(page);
    }
    
    // Additional wait for dynamic content
    await delay(2000);
    
    // Find username/email input field using multiple strategies
    // Based on the actual HTML source, the form has:
    // - Username: id="username", name="username", placeholder="Username"
    // - Password: id="password", name="password", placeholder="Password"
    // - Submit: id="loginButton", type="submit", text="Login"
    let usernameInput = null;
    
    // Strategy 1: Try the exact known selectors first (most reliable)
    const knownUsernameSelectors = [
      '#username',
      'input#username',
      'input[name="username"]',
      'input[id="username"]',
    ];

    for (const selector of knownUsernameSelectors) {
      try {
        usernameInput = await targetPage.$(selector);
        if (usernameInput) {
          const inputType = await usernameInput.evaluate((el: any) => el.type);
          if (inputType !== 'password') {
            console.log(`✅ Found username field using selector: ${selector}`);
            break;
          } else {
            usernameInput = null; // Wrong field, continue
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Strategy 2: Find by placeholder text using XPath (fallback)
    if (!usernameInput) {
      try {
        const usernameXPath = '//input[@placeholder[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "username") or contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "email")]]';
        const usernameElements = await targetPage.$x(usernameXPath);
        if (usernameElements.length > 0) {
          // Filter out password fields
          for (const el of usernameElements) {
            const inputType = await el.evaluate((el: any) => el.type);
            if (inputType !== 'password') {
              usernameInput = el;
              break;
            }
          }
        }
      } catch (e) {
        // Continue to other strategies
      }
    }

    // Strategy 3: Try standard selectors with placeholder matching
    if (!usernameInput) {
      const usernameSelectors = [
        'input[placeholder*="Username/Email" i]',
        'input[placeholder*="username/email" i]',
        'input[placeholder*="Email" i]',
        'input[placeholder*="Username" i]',
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="username" i]',
        'input[id*="email" i]',
      ];

      for (const selector of usernameSelectors) {
        try {
          const elements = await targetPage.$$(selector);
          // Filter out password fields
          for (const el of elements) {
            const inputType = await el.evaluate((el: any) => el.type);
            if (inputType !== 'password') {
              usernameInput = el;
              break;
            }
          }
          if (usernameInput) break;
        } catch (e) {
          // Continue to next selector
        }
      }
    }

    // Strategy 4: Get all inputs and find by placeholder text
    if (!usernameInput) {
      try {
        const allInputs = await targetPage.$$('input');
        for (const input of allInputs) {
          const inputType = await input.evaluate((el: any) => el.type);
          const placeholder = await input.evaluate((el: any) => (el.placeholder || '').toLowerCase());
          if (inputType !== 'password' && (
            placeholder.includes('username') || 
            placeholder.includes('email') ||
            placeholder.includes('username/email')
          )) {
            usernameInput = input;
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    // Strategy 5: Get first non-password input as last resort
    if (!usernameInput) {
      try {
        const allInputs = await targetPage.$$('input');
        for (const input of allInputs) {
          const inputType = await input.evaluate((el: any) => el.type);
          if (inputType !== 'password') {
            usernameInput = input;
            break;
          }
        }
      } catch (e) {
        // Last resort failed
      }
    }

    if (!usernameInput) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'username-field-debug.png', fullPage: true });
      console.error('❌ Could not find username field. Tried selectors:', knownUsernameSelectors);
      console.error('📸 Screenshot saved to username-field-debug.png');
      
      // Try to get all inputs on the page for debugging
      try {
        const allInputs = await targetPage.$$eval('input', (elements) => 
          elements.map((el: any) => ({
            type: el.type,
            id: el.id,
            name: el.name,
            placeholder: el.placeholder,
            className: el.className,
          }))
        );
        console.error('📝 All inputs found on page:', JSON.stringify(allInputs, null, 2));
      } catch (e) {
        console.error('Could not retrieve input list:', e);
      }
      
      throw new Error('Could not find username/email input field. Screenshot saved to username-field-debug.png');
    }

    // Find password input field
    let passwordInput = null;
    
    // Strategy 1: Try the exact known selectors first (most reliable)
    const knownPasswordSelectors = [
      '#password',
      'input#password',
      'input[name="password"]',
      'input[id="password"]',
      'input[type="password"]',
    ];

    for (const selector of knownPasswordSelectors) {
      try {
        passwordInput = await targetPage.$(selector);
        if (passwordInput) {
          const inputType = await passwordInput.evaluate((el: any) => el.type);
          if (inputType === 'password') {
            console.log(`✅ Found password field using selector: ${selector}`);
            break;
          } else {
            passwordInput = null; // Wrong field, continue
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Strategy 2: Standard password selector (fallback)
    if (!passwordInput) {
      try {
        passwordInput = await targetPage.$('input[type="password"]');
      } catch (e) {
        // Continue
      }
    }

    // Strategy 3: Find by placeholder "Password"
    if (!passwordInput) {
      try {
        const allInputs = await targetPage.$$('input');
        for (const input of allInputs) {
          const inputType = await input.evaluate((el: any) => el.type);
          const placeholder = await input.evaluate((el: any) => (el.placeholder || '').toLowerCase());
          if (inputType === 'password' || placeholder.includes('password')) {
            passwordInput = input;
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    // Strategy 4: Try other password selectors
    if (!passwordInput) {
      const passwordSelectors = [
        'input[id*="password" i]',
        'input[placeholder*="Password" i]',
      ];

      for (const selector of passwordSelectors) {
        try {
          passwordInput = await targetPage.$(selector);
          if (passwordInput) break;
        } catch (e) {
          // Continue to next selector
        }
      }
    }

    if (!passwordInput) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'password-field-debug.png', fullPage: true });
      console.error('❌ Could not find password field. Tried selectors:', knownPasswordSelectors);
      console.error('📸 Screenshot saved to password-field-debug.png');
      throw new Error('Could not find password input field. Screenshot saved to password-field-debug.png');
    }

    // Enter credentials (slower typing in visible mode for debugging)
    console.log('⌨️  Entering credentials...');
    const typingDelay = 50; // ms delay between keystrokes
    
    // Clear any existing values first
    await usernameInput.click({ clickCount: 3 }); // Select all
    await usernameInput.type(KAPPA_USERNAME, { delay: typingDelay });
    console.log('✅ Username entered');
    
    await passwordInput.click({ clickCount: 3 }); // Select all
    await passwordInput.type(KAPPA_PASSWORD, { delay: typingDelay });
    console.log('✅ Password entered');

    // Find and click submit button - based on HTML: id="loginButton", type="submit", text="Login"
    let submitted = false;
    
    // Strategy 1: Try the exact known selectors first (most reliable)
    const knownSubmitSelectors = [
      '#loginButton',
      'button#loginButton',
      'button[id="loginButton"]',
      'button[type="submit"]#loginButton',
    ];

    for (const selector of knownSubmitSelectors) {
      try {
        const submitButton = await targetPage.$(selector);
        if (submitButton) {
          await submitButton.click();
          submitted = true;
          console.log(`✅ Found and clicked submit button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Strategy 2: Find by button text content using XPath (fallback)
    if (!submitted) {
      try {
        const submitXPath = '//button[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "log in") or contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "login")]';
        const submitButtons = await targetPage.$x(submitXPath);
        if (submitButtons.length > 0) {
          await submitButtons[0].click();
          submitted = true;
        }
      } catch (e) {
        // Continue to other strategies
      }
    }

    // Strategy 3: Try standard selectors and check text
    if (!submitted) {
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button',
      ];

      for (const selector of submitSelectors) {
        try {
          const buttons = await targetPage.$$(selector);
          for (const button of buttons) {
            const buttonText = await button.evaluate((el: any) => 
              (el.textContent || el.value || '').toLowerCase().trim()
            );
            if (buttonText.includes('log in') || buttonText.includes('login') || 
                buttonText.includes('sign in') || selector === 'button[type="submit"]') {
              await button.click();
              submitted = true;
              break;
            }
          }
          if (submitted) break;
        } catch (e) {
          // Continue to next selector
        }
      }
    }

    if (!submitted) {
      // Try pressing Enter as fallback
      console.log('⚠️  Could not find submit button, trying Enter key...');
      await targetPage.keyboard.press('Enter');
      await delay(2000); // Wait a bit after pressing Enter
      submitted = true; // Assume it worked
    }

    console.log('⏳ Waiting for login to complete...');
    
    // Wait for navigation after login (wait for URL change or specific element)
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      console.log('✅ Page navigated after login');
    } catch (e) {
      console.log('⚠️  No navigation detected, checking if already logged in...');
      // Navigation might not happen, check if we're logged in by looking for logout or profile elements
    }
    
    // Give it a moment for any redirects
    await delay(2000);

    // Verify login success by checking for common post-login elements
    const loggedInIndicators = [
      'a[href*="logout"]',
      'a[href*="profile"]',
      'button[aria-label*="user" i]',
      '[data-testid*="user" i]',
    ];

    let loggedIn = false;
    for (const indicator of loggedInIndicators) {
      try {
        await page.waitForSelector(indicator, { timeout: 5000 });
        loggedIn = true;
        break;
      } catch (e) {
        // Continue checking
      }
    }

    // Also check if URL changed from login page
    const currentUrl = page.url();
    if (!currentUrl.includes('/login') && !currentUrl.includes('/s/login')) {
      loggedIn = true;
    }

    if (!loggedIn) {
      // Take screenshot for debugging
      const screenshotPath = 'login-failure.png';
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      console.log(`📸 Screenshot saved to ${screenshotPath} for debugging`);
      console.log(`Current URL: ${page.url()}`);
      console.log('💡 If browser is visible, you can inspect the page to see what went wrong');
      
      throw new Error('Login verification failed - could not confirm successful login');
    }

    console.log('Successfully logged in to Kappa Alpha Psi portal');
    return true;
  } catch (error: any) {
    console.error('Error logging in to Kappa portal:', error.message);
    // Take screenshot for debugging
    await page.screenshot({ path: 'login-error.png' }).catch(() => {});
    return false;
  }
}

/**
 * Search for a member by name and membership number
 */
export async function searchMember(
  page: Page,
  name: string,
  membershipNumber: string
): Promise<MemberSearchResult> {
  try {
    // Wait a bit for page to be ready
    await delay(1000);

    // Look for search functionality - common patterns
    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="search" i]',
      'input[name*="search" i]',
      'input[id*="search" i]',
      'input[aria-label*="search" i]',
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        searchInput = await page.$(selector);
        if (searchInput) break;
      } catch (e) {
        // Continue
      }
    }

    // If no search input found, try navigating to a member directory/search page
    if (!searchInput) {
      // Try common member directory URLs
      const directoryUrls = [
        '/members',
        '/directory',
        '/search',
        '/member-directory',
      ];

      for (const url of directoryUrls) {
        try {
          const fullUrl = new URL(url, page.url()).href;
          await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 10000 });
          await delay(2000);

          // Try to find search input again
          for (const selector of searchSelectors) {
            try {
              searchInput = await page.$(selector);
              if (searchInput) break;
            } catch (e) {
              // Continue
            }
          }
          if (searchInput) break;
        } catch (e) {
          // Continue to next URL
        }
      }
    }

    if (!searchInput) {
      // If still no search input, try searching by membership number in URL or form
      // This is a fallback - the actual implementation may need to be adjusted based on the site structure
      return {
        found: false,
        nameMatch: false,
        membershipNumberMatch: false,
        error: 'Could not find search functionality on the page',
      };
    }

    // Clear and enter search term (try membership number first as it's more unique)
    await searchInput.click({ clickCount: 3 }); // Select all
    await searchInput.type(membershipNumber, { delay: 100 });

    // Submit search (press Enter or click search button)
    await page.keyboard.press('Enter');
    await delay(2000); // Wait for results

    // Look for search results
    const resultSelectors = [
      '.search-result',
      '.member-result',
      '[data-testid*="result" i]',
      'table tbody tr',
      '.member-card',
      '.member-item',
    ];

    let resultsFound = false;
    let resultElements: any[] = [];

    for (const selector of resultSelectors) {
      try {
        resultElements = await page.$$(selector);
        if (resultElements.length > 0) {
          resultsFound = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!resultsFound) {
      // Try searching by name instead
      await searchInput.click({ clickCount: 3 });
      await searchInput.type(name, { delay: 100 });
      await page.keyboard.press('Enter');
      await delay(2000);

      // Check for results again
      for (const selector of resultSelectors) {
        try {
          resultElements = await page.$$(selector);
          if (resultElements.length > 0) {
            resultsFound = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }

    if (!resultsFound || resultElements.length === 0) {
      return {
        found: false,
        nameMatch: false,
        membershipNumberMatch: false,
        error: 'No search results found',
      };
    }

    // Check each result for name and membership number match
    let nameMatch = false;
    let membershipNumberMatch = false;
    let matchedDetails: any = {};

    for (const element of resultElements) {
      try {
        const text = await element.evaluate((el: any) => el.textContent || '');
        const innerHTML = await element.evaluate((el: any) => el.innerHTML || '');

        // Check for name match (case-insensitive, partial match)
        const nameRegex = new RegExp(name.replace(/\s+/g, '\\s+'), 'i');
        if (nameRegex.test(text) || nameRegex.test(innerHTML)) {
          nameMatch = true;
        }

        // Check for membership number match (exact)
        if (text.includes(membershipNumber) || innerHTML.includes(membershipNumber)) {
          membershipNumberMatch = true;
        }

        // If both match, extract details
        if (nameMatch && membershipNumberMatch) {
          // Try to extract more details from the element
          const nameElement = await element.$('td, .name, [class*="name" i]');
          const membershipElement = await element.$('td, .membership, [class*="membership" i], [class*="number" i]');

          if (nameElement) {
            matchedDetails.name = await nameElement.evaluate((el: any) => el.textContent?.trim() || '');
          }
          if (membershipElement) {
            matchedDetails.membershipNumber = await membershipElement.evaluate((el: any) => el.textContent?.trim() || '');
          }

          break; // Found match, no need to check other results
        }
      } catch (e) {
        // Continue to next element
        console.error('Error checking result element:', e);
      }
    }

    return {
      found: nameMatch && membershipNumberMatch,
      nameMatch,
      membershipNumberMatch,
      details: matchedDetails,
    };
  } catch (error: any) {
    console.error('Error searching for member:', error.message);
    return {
      found: false,
      nameMatch: false,
      membershipNumberMatch: false,
      error: error.message,
    };
  }
}

/**
 * Verify a member by searching for them in the portal
 */
export async function verifyMember(
  page: Page,
  name: string,
  membershipNumber: string
): Promise<MemberSearchResult> {
  return await searchMember(page, name, membershipNumber);
}

