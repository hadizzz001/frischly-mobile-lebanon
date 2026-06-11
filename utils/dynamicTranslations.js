// utils/dynamicTranslations.js
//
// Arabic translations for DYNAMIC data that comes from the backend (category and
// subcategory names). These are a finite, generic taxonomy that repeats all over
// the app (section headers, filter chips, footer menu, product detail, ...).
//
// Product names and kitchen names are intentionally NOT listed here: they are
// arbitrary free text (mostly brand names like "Nutella" / "Coca-Cola", or store
// specific items) that must not be machine-translated. The helper below falls
// back to the original text for anything not found in this dictionary, so brand
// and item names are shown exactly as stored.
//
// Keys are matched case-insensitively and trimmed (see translateDynamic).

export const dynamicAr = {
	// ---- Categories (main store) ----
	office: "المكتب",
	"eggs, milk & butter": "البيض والحليب والزبدة",
	"cereals & spreads": "الحبوب والمربيات",
	"canned goods, instant meals & more": "المعلّبات والوجبات السريعة والمزيد",
	"sauces, oils & spices": "الصلصات والزيوت والبهارات",
	"pasta, rice & international cooking": "المعكرونة والأرز والمطبخ العالمي",
	"frozen foods": "الأطعمة المجمّدة",
	"coffee, tea & cocoa": "القهوة والشاي والكاكاو",
	"chocolate & cookies": "الشوكولاتة والبسكويت",
	"salty snacks": "الوجبات الخفيفة المالحة",
	"sweets & candies": "الحلويات والسكاكر",
	"ice cream": "البوظة",
	"cats & dogs": "القطط والكلاب",
	"non-alcoholic beverages": "المشروبات غير الكحولية",
	drugstore: "مستلزمات العناية",
	"household products": "المنتجات المنزلية",
	baby: "مستلزمات الأطفال",
	grilling: "الشواء",
	electronics: "الإلكترونيات",

	// ---- Subcategories ----
	airpods: "سمّاعات AirPods",
	juice: "عصير",
	water: "ماء",
	"kitchen & dishwash": "المطبخ وغسل الصحون",
	cleaner: "منظّف",
	bath: "الاستحمام",
	"paper towels & toiletries": "المناديل الورقية ومستلزمات النظافة",
	sodas: "المشروبات الغازية",
	salt: "ملح",
	stationery: "القرطاسية",
	"office supplies": "مستلزمات المكتب",
	chocolate: "شوكولاتة",
	hair: "العناية بالشعر",
	"instant coffee": "قهوة سريعة التحضير",
	"muesli & oat flakes": "الموسلي ورقائق الشوفان",
	vegetables: "خضروات",
	"ketchup & grill sauces": "الكاتشب وصلصات الشواء",
	"chips & flips": "رقائق البطاطس والمقرمشات",
	"stews & soups": "اليخنات والشوربات",
	cats: "القطط",
	eggs: "البيض",
	laundry: "غسيل الملابس",
	cola: "كولا",
	"fruit gummies & liquorice": "حلوى الفواكه والعرقسوس",
	"ice cream single packs": "بوظة عبوة فردية",
	pasta: "معكرونة",
	batteries: "بطاريات",
	dog: "الكلاب",
	bars: "ألواح الحلوى",
	"mayonnaise & mustard": "المايونيز والخردل",
	"crackers & pretzel pastries": "المقرمشات ومعجنات البريتزل",
	"coffee pads": "أقراص القهوة",
	"showering & bathing": "الاستحمام والاغتسال",
	"ice cream cup": "كأس بوظة",
	"spezi & cola mix": "مزيج الكولا",
	cereals: "حبوب الإفطار",
	"canned vegetables": "الخضروات المعلّبة",
	"potato products": "منتجات البطاطس",
	"fresh milk": "حليب طازج",
	"fruit spreads": "مربّى الفواكه",
	"ice cream multipacks": "بوظة عبوات متعددة",
	biscuits: "بسكويت",
	"kitchen roll": "مناديل المطبخ",
	"oral & dental hygiene": "العناية بالفم والأسنان",
	pizza: "بيتزا",
	"other sauces": "صلصات أخرى",
	"filter coffee": "قهوة مفلترة",
	"iced tea & mate": "الشاي المثلّج والمتة",
	nuts: "المكسرات",
	"canned tomatoes": "الطماطم المعلّبة",
	"milk drinks": "مشروبات الحليب",
	"sweet pastry": "معجنات حلوة",
	"mini pizza & baguettes": "بيتزا صغيرة وباغيت",
	rice: "أرز",
	deodorant: "مزيل العرق",
	"canned fish": "الأسماك المعلّبة",
	"muesli & protein bars": "ألواح الموسلي والبروتين",
	"coffee capsules": "كبسولات القهوة",
	"ice cream sticks": "بوظة على عود",
	"vinegar, dressing & salad toppings": "الخل والصلصات وإضافات السلطة",
	popcorn: "الفشار",
	"milk alternatives": "بدائل الحليب",
	"tortillas & dips": "التورتيلا والصلصات",
	"nut & chocolate spreads": "زبدة المكسرات والشوكولاتة",
	"shaving & hair removal": "الحلاقة وإزالة الشعر",
	"cream & sour cream": "الكريمة والقشطة الحامضة",
	"energy drink": "مشروب الطاقة",
	"instant meals": "وجبات سريعة التحضير",
	"black & green tea": "الشاي الأسود والأخضر",
	fish: "السمك",
	oil: "زيت",
	"waffle ice cream": "بوظة الويفر",
	"sweet pastries": "معجنات حلوة",
	international: "مأكولات عالمية",
	"ready meals": "وجبات جاهزة",
	pralines: "برالين",
	antipasti: "مقبّلات",
	"hand & body care": "العناية باليدين والجسم",
	"ice cream bars & snacks": "ألواح وسناك البوظة",
	"butter & margarine": "الزبدة والسمن النباتي",
	honey: "عسل",
	flour: "طحين",
	cocoa: "كاكاو",
	"facial care & cosmetics": "العناية بالوجه ومستحضرات التجميل",
	"ice cream toppings": "إضافات البوظة",
	"broth & stock": "المرق",
	"baking ingredients": "مكونات الخبز",
	"fix products": "منتجات التتبيل الجاهزة",
	"coffee & tea accessories": "إكسسوارات القهوة والشاي",
	soap: "صابون",
	"ice cubes": "مكعبات الثلج",
	"fruit tea": "شاي الفواكه",
	"men's care": "العناية بالرجال",
	"baking & dessert mixes": "خلطات الخبز والحلويات",
	"wellbeing & mood tea": "شاي الاسترخاء",
	spices: "بهارات",
	"sugar & sweeteners": "السكر والمحلّيات",
	"love & more": "الحميمية والمزيد",
	"coffee drinks": "مشروبات القهوة",
	"sports drinks": "المشروبات الرياضية",
	"fresh juices & smoothies": "العصائر الطازجة والسموذي",
	menstruation: "منتجات الدورة الشهرية",
	"flavoured water": "المياه المنكّهة",
	"tonics & mixers": "التونيك والمشروبات المخلوطة",
};

/**
 * Translate a dynamic (backend) name to the active language.
 *
 * - For English (or any non-Arabic language) the original name is returned.
 * - For Arabic, the name is looked up case-insensitively/trimmed in the
 *   dictionary; if there is no entry (e.g. a brand/product/kitchen name) the
 *   original name is returned unchanged.
 *
 * @param {string} name
 * @param {string} language
 * @returns {string}
 */
export const translateDynamic = (name, language) => {
	if (!name || language !== "ar") return name;
	const key = String(name).trim().toLowerCase();
	return dynamicAr[key] || name;
};
