const express    = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// const { GoogleGenAI } = require('@google/genai'); // reserved for future use (Imagen / Veo)
const User    = require('../models/User');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Coupon  = require('../models/Coupon');
const { adminProtect } = require('../middleware/adminAuth');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const AD_SYSTEM_PROMPT = `You are an expert social media marketing copywriter for Ysho, a premium A2 Desi Cow Bilona Ghee brand from India.

Brand facts:
- 100% pure A2 desi cow milk, sourced ethically
- Traditional Bilona hand-churning process — no machines
- No preservatives, no additives, no artificial flavours
- Rich in vitamins A, D, E, K and butyric acid
- Supports digestion, immunity, and bone health
- Premium packaging, suitable for gifting
- Available in 250ml, 500ml, and 1000ml jars
- Website: ysho.in | Email: care@ysho.in

Platform guidelines:
- Facebook: conversational, slightly longer caption (3-5 sentences), link-friendly
- Instagram: visually evocative, emoji-friendly, 2-3 sentences, strong hashtag set (15-20 tags)
- WhatsApp Status: very short, punchy, personal tone (1-2 sentences max)

Tone options:
- Informative: facts-first, educational, builds trust
- Promotional: offer/discount-led, urgency, value-focused
- Festive: warm, celebratory, ties ghee to Indian festivals and traditions
- Storytelling: narrative, evokes nostalgia, connects to roots

Always respond with valid JSON only — no markdown, no extra text. Format:
{
  "headline": "max 10 words, punchy",
  "caption": "platform-appropriate body copy",
  "hashtags": ["tag1", "tag2"],
  "cta": "max 8 words call to action"
}`;

const router = express.Router();

// GET /api/admin/users — all registered users
router.get('/users', adminProtect, async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders — all orders with user info
router.get('/orders', adminProtect, async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status — update order status
router.patch('/orders/:id/status', adminProtect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'failed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/products — all products (including inactive)
router.get('/products', adminProtect, async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ createdAt: 1 });
    res.json({ success: true, products });
  } catch (err) { next(err); }
});

// POST /api/admin/products — create product with variants
router.post('/products', adminProtect, async (req, res, next) => {
  try {
    const { name, description, image, variants } = req.body;
    if (!name || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ success: false, message: 'name and at least one variant are required.' });
    }
    const product = await Product.create({ name, description, image, variants });
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
});

// PUT /api/admin/products/:id — update product name / image / isActive / full variants array
router.put('/products/:id', adminProtect, async (req, res, next) => {
  try {
    const { name, description, image, isActive, variants } = req.body;
    const update = {};
    if (name        != null) update.name        = name;
    if (description != null) update.description = description;
    if (image       != null) update.image       = image;
    if (isActive    != null) update.isActive    = isActive;
    if (variants    != null) update.variants    = variants;

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
});

// PATCH /api/admin/products/:id/variant — update a single variant's price/isActive by size
router.patch('/products/:id/variant', adminProtect, async (req, res, next) => {
  try {
    const { size, price, isActive } = req.body;
    if (!size) return res.status(400).json({ success: false, message: 'size is required.' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const variant = product.variants.find((v) => v.size === size);
    if (!variant) return res.status(404).json({ success: false, message: `Variant ${size} not found.` });

    if (price    != null) variant.price    = price;
    if (isActive != null) variant.isActive = isActive;
    await product.save();

    res.json({ success: true, product });
  } catch (err) { next(err); }
});

// DELETE /api/admin/products/:id — permanently delete
router.delete('/products/:id', adminProtect, async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PATCH /api/admin/orders/:id/tracking — set India Post consignment number
router.patch('/orders/:id/tracking', adminProtect, async (req, res, next) => {
  try {
    const { trackingNumber } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { trackingNumber: trackingNumber?.trim() || null },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, order });
  } catch (err) { next(err); }
});

// ── Coupon CRUD ───────────────────────────────────────────────────────────────

// GET /api/admin/coupons
router.get('/coupons', adminProtect, async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) { next(err); }
});

// POST /api/admin/coupons
router.post('/coupons', adminProtect, async (req, res, next) => {
  try {
    const { code, discountPercent, usageLimit, expiresAt } = req.body;
    if (!code || !discountPercent) {
      return res.status(400).json({ success: false, message: 'Code and discountPercent are required.' });
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountPercent,
      usageLimit: usageLimit || null,
      expiresAt:  expiresAt  || null,
    });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Coupon code already exists.' });
    next(err);
  }
});

// PUT /api/admin/coupons/:id
router.put('/coupons/:id', adminProtect, async (req, res, next) => {
  try {
    const { discountPercent, isActive, usageLimit, expiresAt } = req.body;
    const update = {};
    if (discountPercent != null) update.discountPercent = discountPercent;
    if (isActive        != null) update.isActive        = isActive;
    if (usageLimit      != null) update.usageLimit      = usageLimit || null;
    if (expiresAt       != null) update.expiresAt       = expiresAt  || null;

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, coupon });
  } catch (err) { next(err); }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', adminProtect, async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/admin/generate-ad — AI ad copy generator
router.post('/generate-ad', adminProtect, async (req, res, next) => {
  try {
    const { productName, platform, tone, context } = req.body;
    if (!productName || !platform || !tone) {
      return res.status(400).json({ success: false, message: 'productName, platform, and tone are required.' });
    }

    const userPrompt = `Generate ad copy for:
Product: ${productName}
Platform: ${platform}
Tone: ${tone}${context ? `\nExtra context / offer: ${context}` : ''}

Return JSON only.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      systemInstruction: AD_SYSTEM_PROMPT,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(userPrompt);
    const raw = result.response.text().trim();
    let adCopy;
    try {
      adCopy = JSON.parse(raw);
    } catch {
      return res.status(500).json({ success: false, message: 'Failed to parse AI response. Please try again.' });
    }

    res.json({ success: true, adCopy });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/generate-ad-image — Gemini Vision context + Pollinations generation
router.post('/generate-ad-image', adminProtect, async (req, res, next) => {
  try {
    const { productName, productId, platform, tone, context, overridePrompt } = req.body;
    if (!productName) {
      return res.status(400).json({ success: false, message: 'productName is required.' });
    }

    // Step 1: if a real product was selected, analyse its image with Gemini Vision
    let visualDescription = '';
    let productVariants = '';
    let promptParts;

    if (productId) {
      const product = await Product.findById(productId).lean();
      if (product) {
        const activeVariants = (product.variants || []).filter(v => v.isActive);
        if (activeVariants.length) {
          productVariants = `sizes ${activeVariants.map(v => v.size).join(', ')}`;
        }

        if (product.image) {
          try {
            const imgRes = await fetch(product.image);
            if (imgRes.ok) {
              const buffer = await imgRes.arrayBuffer();
              const base64 = Buffer.from(buffer).toString('base64');
              const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

              const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
              const visionResult = await visionModel.generateContent([
                { inlineData: { data: base64, mimeType } },
                'Describe this product image in 1-2 sentences for use in a text-to-image prompt: focus on packaging shape, colors, label style, and visual mood. Be concise and descriptive.',
              ]);
              visualDescription = visionResult.response.text().trim();
            }
          } catch {
            // Vision step failed — continue with text-only prompt
          }
        }
      }
    }

    // Step 2: build enriched prompt (skip if user provided an override)
    promptParts = overridePrompt?.trim() || [
      `professional advertisement photo, Ysho ${productName} premium Indian A2 desi cow Bilona ghee`,
      visualDescription || 'glass jar with golden ghee, elegant label',
      productVariants,
      'traditional Indian home kitchen setting, rustic wooden surface, clay pot, warm golden hour lighting',
      'photorealistic, high resolution, rich warm tones, premium product photography',
      `${tone || 'warm'} mood`,
      context || '',
      'no text, no logos, no watermarks',
    ].filter(Boolean).join(', ');

    // Step 3: fetch image from Pollinations
    const encodedPrompt = encodeURIComponent(promptParts);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`;

    const imgResponse = await fetch(pollinationsUrl);
    if (!imgResponse.ok) {
      return res.status(500).json({ success: false, message: 'Image generation failed. Please try again.' });
    }

    const imageBuffer = await imgResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';

    res.json({
      success: true,
      image: `data:${mimeType};base64,${base64Image}`,
      prompt: promptParts,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
