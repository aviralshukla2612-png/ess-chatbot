/**
 * Emperor Nexus — Industry-Based AI Bot Creation Wizard
 * Dynamic industry templates, question configurations, and knowledge synthesis helpers.
 */

export const INDUSTRIES = [
  {
    id: "clinic",
    name: "Clinic",
    category: "Healthcare",
    iconName: "Stethoscope",
    badge: "Healthcare",
    accentColor: "#00D98B",
    description: "Medical practices, dental care, dermatology, physiotherapy & specialist healthcare clinics.",
    defaultBotName: "Clinic Care Assistant",
    defaultWelcomeMessage: "Hello! Welcome to our clinic. I can help you with consultation timings, doctor specialties, service fees, and appointment guidance. How may I assist you today?",
    starterQuestions: [
      "What doctors and specialists are available?",
      "What are your consultation timings and fees?",
      "Do I need an appointment or are walk-ins welcome?",
      "What should I bring for my first consultation?",
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    category: "Property",
    iconName: "Building2",
    badge: "Property",
    accentColor: "#55A9FF",
    description: "Property developers, real estate agencies, brokers, commercial leasing & rental managers.",
    defaultBotName: "Nexus Property Advisor",
    defaultWelcomeMessage: "Hello! Looking for your ideal home, commercial space, or investment property? I can share available listings, price ranges, prime locations, and arrange a site visit. What type of property are you interested in?",
    starterQuestions: [
      "What properties are currently available?",
      "What locations and neighborhoods do you cover?",
      "What are your property price ranges?",
      "Can I schedule a property site visit?",
    ],
  },
  {
    id: "education",
    name: "Education",
    category: "Academia",
    iconName: "GraduationCap",
    badge: "Academia",
    accentColor: "#C28AFF",
    description: "Schools, universities, coaching academies, edtech platforms & specialized skill institutes.",
    defaultBotName: "Admissions & Course Advisor",
    defaultWelcomeMessage: "Hello! Welcome to our academy. I can guide you through our courses, admission criteria, fee structures, and batch schedules. Which program are you exploring?",
    starterQuestions: [
      "What courses and programs do you offer?",
      "What are the course fees and payment options?",
      "When does the next admission batch start?",
      "Are classes conducted online, offline, or hybrid?",
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    category: "Hospitality & Food",
    iconName: "UtensilsCrossed",
    badge: "Dining",
    accentColor: "#FF7849",
    description: "Cafes, fine dining, bistros, bakeries, lounges, bars & cloud delivery kitchens.",
    defaultBotName: "Gourmet Concierge",
    defaultWelcomeMessage: "Welcome to our restaurant! I can help you explore our menu, popular chef specialties, table reservations, and takeaway options. What can I get started for you today?",
    starterQuestions: [
      "What cuisines and dishes do you serve?",
      "What are your most popular signature dishes?",
      "What are your opening hours and meal slots?",
      "Do you offer takeaway, delivery, or table booking?",
    ],
  },
  {
    id: "hotel",
    name: "Hotel",
    category: "Hospitality & Travel",
    iconName: "Bed",
    badge: "Stay",
    accentColor: "#009DFF",
    description: "Hotels, luxury resorts, boutique villas, guest houses, homestays & serviced suites.",
    defaultBotName: "Hotel Concierge Assistant",
    defaultWelcomeMessage: "Welcome to our hotel! I am here to help you with room categories, nightly rates, check-in policies, and resort amenities. How can I assist with your stay?",
    starterQuestions: [
      "What room categories are available and what are their rates?",
      "What are your check-in and check-out timings?",
      "What facilities and amenities do you provide?",
      "What is your reservation and cancellation policy?",
    ],
  },
  {
    id: "hospital",
    name: "Hospital",
    category: "Healthcare",
    iconName: "Building",
    badge: "Emergency & Super Specialty",
    accentColor: "#00E5FF",
    description: "Multi-specialty hospitals, emergency centers, surgical institutes & diagnostic networks.",
    defaultBotName: "Hospital Helpdesk AI",
    defaultWelcomeMessage: "Hello! Welcome to our hospital. I can assist you with department directories, specialist OPD schedules, diagnostic test details, and 24/7 emergency contacts. How can I help you today?",
    starterQuestions: [
      "Which medical departments and specialties are available?",
      "What are the OPD timings and doctor consultation hours?",
      "What diagnostic and imaging services do you offer?",
      "What are your 24/7 emergency and ambulance contact details?",
    ],
  },
  {
    id: "retail-ecommerce",
    name: "Retail & E-commerce",
    category: "Commerce",
    iconName: "ShoppingBag",
    badge: "Commerce",
    accentColor: "#963DFF",
    description: "Online storefronts, direct-to-consumer brands, fashion labels & retail store chains.",
    defaultBotName: "Shopping Assistant",
    defaultWelcomeMessage: "Hello! Welcome to our store. I can help you find products, check current discounts, track delivery timelines, and understand return policies. What are you shopping for today?",
    starterQuestions: [
      "What product categories and collections do you sell?",
      "What are your top-selling products and current offers?",
      "What are your shipping times and delivery charges?",
      "What is your return and refund policy?",
    ],
  },
  {
    id: "professional-services",
    name: "Professional Services",
    category: "Consulting & Corporate",
    iconName: "Briefcase",
    badge: "Corporate",
    accentColor: "#B68A55",
    description: "Law firms, CA & financial consultancies, IT services, marketing agencies & corporate advisors.",
    defaultBotName: "Client Services Consultant",
    defaultWelcomeMessage: "Hello! Welcome. I can help you learn about our professional services, engagement models, service fees, and schedule a discovery consultation. How can we support your business?",
    starterQuestions: [
      "What services and packages do you provide?",
      "How do you charge for your services?",
      "What is your typical project process and timeline?",
      "How can I book a discovery consultation?",
    ],
  },
  {
    id: "other",
    name: "Other",
    category: "Custom Enterprise",
    iconName: "Sparkles",
    badge: "Custom",
    accentColor: "#E0E0E0",
    description: "Custom businesses, creative studios, logistics, manufacturing, local services & startups.",
    defaultBotName: "Business Assistant",
    defaultWelcomeMessage: "Hello! Welcome to our business. I can answer your questions about our offerings, pricing, operating hours, and how we work. How can I help you today?",
    starterQuestions: [
      "What products and services do you offer?",
      "What are your pricing and payment options?",
      "What are your working hours and location?",
      "How do I get started with your services?",
    ],
  },
];

/**
 * Returns structured question groups for each industry.
 * Each question has:
 *  - id: key in answers object
 *  - label: human-readable question title
 *  - subtitle: contextual instruction
 *  - type: 'text' | 'textarea' | 'select' | 'multiselect' | 'repeater' | 'time'
 *  - placeholder: example hint
 *  - options: select / multiselect choices
 *  - fields: child fields for repeater items
 *  - required: boolean
 */
export function getIndustryQuestions(industryId) {
  switch (industryId) {
    case "clinic":
      return [
        {
          id: "medicalServices",
          label: "What medical services and treatments do you provide?",
          subtitle: "Select or specify the clinical specialties and healthcare treatments available.",
          type: "multiselect",
          required: true,
          options: [
            "General Physician Consultation",
            "Dental Care & Cleaning",
            "Dermatology & Skin Treatments",
            "Pediatrics & Child Care",
            "Physiotherapy & Rehab",
            "Cardiology Screenings",
            "Gynecology & Women's Health",
            "Orthopedic Consultation",
            "Pathology & Blood Tests",
            "Vaccination & Immunization",
          ],
          allowCustom: true,
          placeholder: "e.g. Laser cosmetic therapy, root canal treatments...",
        },
        {
          id: "doctors",
          label: "Which doctors and specialists are available?",
          subtitle: "Add doctor profiles so patients can check qualifications and availability.",
          type: "repeater",
          required: false,
          itemTitle: "Doctor",
          fields: [
            { key: "name", label: "Doctor's Full Name", placeholder: "e.g. Dr. Ramesh Gupta", type: "text", required: true },
            { key: "specialty", label: "Specialty / Designation", placeholder: "e.g. Senior Dermatologist (MD)", type: "text", required: true },
            { key: "timings", label: "Consultation Timings", placeholder: "e.g. Mon–Fri 10:00 AM – 2:00 PM", type: "text" },
            { key: "experience", label: "Experience / Background", placeholder: "e.g. 15+ years experience, Ex-AIIMS", type: "text" },
          ],
        },
        {
          id: "consultationTimings",
          label: "What are your consultation timings & working days?",
          subtitle: "Specify regular clinic operational schedule and doctor availability windows.",
          type: "textarea",
          required: true,
          placeholder: "Morning Session: 10:00 AM to 01:30 PM (Mon to Sat)\nEvening Session: 05:00 PM to 08:30 PM (Mon to Sat)\nSundays: By emergency appointment only.",
        },
        {
          id: "consultationFees",
          label: "What are your consultation fees & payment options?",
          subtitle: "Provide clear fee information so patients understand consultation costs.",
          type: "text",
          required: false,
          placeholder: "e.g. ₹500 for general consultation, ₹800 for specialist review. Digital UPI and Cards accepted.",
        },
        {
          id: "appointmentPolicy",
          label: "Do patients need prior appointments or are walk-ins welcome?",
          subtitle: "Explain how patients should book slots or if emergency walk-ins are allowed.",
          type: "select",
          required: true,
          options: [
            "Appointments Preferred, Walk-ins also accepted",
            "Prior Appointment Strictly Required",
            "Walk-ins Welcome Anytime During OPD Hours",
            "Same-day Online Token Booking Required",
          ],
        },
        {
          id: "patientGuidelines",
          label: "What should patients know or bring before visiting?",
          subtitle: "Required documents, fasting instructions, past medical records, etc.",
          type: "textarea",
          required: false,
          placeholder: "Please carry previous prescription slips, diagnostic reports, and a valid photo ID. For blood sugar/lipid tests, 10–12 hours fasting is required.",
        },
        {
          id: "clinicPolicies",
          label: "What are your clinic policies & cancellation guidelines?",
          subtitle: "Appointment rescheduling, emergency triage policy, and confidentiality.",
          type: "textarea",
          required: false,
          placeholder: "Appointments can be rescheduled up to 2 hours prior without fee. Emergency cases receive priority triage.",
        },
      ];

    case "real-estate":
      return [
        {
          id: "propertyTypes",
          label: "What types of properties do you deal in?",
          subtitle: "Select all categories your brokerage or development company handles.",
          type: "multiselect",
          required: true,
          options: [
            "Luxury Apartments & Penthouses",
            "Affordable 1, 2 & 3 BHK Flats",
            "Independent Villas & Bungalows",
            "Commercial Office Spaces",
            "High-Street Retail Shops & Showrooms",
            "Residential & Investment Plots",
            "Industrial Warehouses & Land",
            "Rental & Lease Properties",
          ],
          allowCustom: true,
        },
        {
          id: "locationsCovered",
          label: "Which cities, regions, and neighborhoods do you cover?",
          subtitle: "List primary project locations, sub-markets, and expansion areas.",
          type: "textarea",
          required: true,
          placeholder: "e.g. Ahmedabad (SG Highway, Bopal, Science City, Prahlad Nagar), Gandhinagar, and Mumbai suburban corridors.",
        },
        {
          id: "availableProperties",
          label: "What key properties or projects are currently available?",
          subtitle: "Add featured project listings so buyers can get direct specs and pricing.",
          type: "repeater",
          required: false,
          itemTitle: "Property Listing",
          fields: [
            { key: "name", label: "Project / Property Name", placeholder: "e.g. Nexus Skyvillas", type: "text", required: true },
            { key: "type", label: "Type / Configuration", placeholder: "e.g. 3 & 4 BHK Luxury Apartments", type: "text", required: true },
            { key: "price", label: "Price / Starting From", placeholder: "e.g. ₹85 Lakhs – ₹1.4 Cr", type: "text", required: true },
            { key: "location", label: "Location", placeholder: "e.g. SG Highway, Near Vaishnodevi Circle", type: "text" },
            { key: "status", label: "Possession Status", placeholder: "e.g. Ready to Move / Dec 2026", type: "text" },
          ],
        },
        {
          id: "priceRanges",
          label: "What are your typical property price ranges?",
          subtitle: "Helps buyers determine if your portfolio matches their budget.",
          type: "textarea",
          required: false,
          placeholder: "Residential: ₹45 Lakhs to ₹3.5 Crores\nCommercial Spaces: ₹65 Lakhs to ₹10 Crores\nPlots: Starting from ₹2,500/sq.ft.",
        },
        {
          id: "siteVisits",
          label: "Do you offer property site visits and sample flat tours?",
          subtitle: "Explain days, cab pickup availability, and booking procedure.",
          type: "textarea",
          required: true,
          placeholder: "Yes! Free guided site visits are available 7 days a week from 10:00 AM to 6:30 PM. We also provide complimentary site pickup upon request.",
        },
        {
          id: "buyerInquiryDetails",
          label: "What property details should visitors provide when enquiring?",
          subtitle: "What information helps your agents recommend the best matching properties?",
          type: "textarea",
          required: false,
          placeholder: "Preferred BHK configuration, target budget bracket, preferred locality, investment vs self-use, and planned possession timeline.",
        },
      ];

    case "education":
      return [
        {
          id: "courses",
          label: "What courses and programs do you offer?",
          subtitle: "Add primary programs, diploma courses, degrees, or certifications.",
          type: "repeater",
          required: true,
          itemTitle: "Course / Program",
          fields: [
            { key: "name", label: "Course Title", placeholder: "e.g. Full Stack Web & AI Engineering", type: "text", required: true },
            { key: "duration", label: "Duration", placeholder: "e.g. 6 Months (Full-Time)", type: "text", required: true },
            { key: "fee", label: "Course Fee", placeholder: "e.g. ₹65,000 (EMI Available)", type: "text" },
            { key: "mode", label: "Mode (Online / Offline)", placeholder: "e.g. Hybrid / Classroom", type: "text" },
          ],
        },
        {
          id: "eligibility",
          label: "What are the eligibility requirements & prerequisites?",
          subtitle: "Educational background, minimum percentages, or entrance assessments.",
          type: "textarea",
          required: true,
          placeholder: "Graduates, diploma holders, or final-year students from any discipline with basic computer proficiency. No prior coding experience required.",
        },
        {
          id: "deliveryMode",
          label: "Are classes conducted online, offline, or hybrid?",
          subtitle: "Detail class schedule, batch sizes, and lecture recordings availability.",
          type: "select",
          required: true,
          options: [
            "Hybrid (Both Classroom & Live Online Options)",
            "100% Live Interactive Online Classes",
            "Offline In-Person Classroom Training Only",
            "Self-Paced Recorded Lectures + Weekly Live Mentorship",
          ],
        },
        {
          id: "admissionDates",
          label: "What are the upcoming admission dates and batch intakes?",
          subtitle: "Give dates for upcoming cohorts, registration deadlines, and seat limits.",
          type: "textarea",
          required: false,
          placeholder: "New batches commence on the 1st and 15th of every month. Early bird enrollment closes 5 days before cohort start.",
        },
        {
          id: "feePaymentOptions",
          label: "What are your course fees & payment plan options?",
          subtitle: "Upfront discounts, installment schedules, zero-cost EMI, or scholarships.",
          type: "textarea",
          required: false,
          placeholder: "Flexible 3-month and 6-month zero-interest EMI options available. 10% discount for upfront one-time payment. Merit scholarships available.",
        },
      ];

    case "restaurant":
      return [
        {
          id: "cuisines",
          label: "What cuisines and food styles do you serve?",
          subtitle: "Select all cuisine specialties offered at your establishment.",
          type: "multiselect",
          required: true,
          options: [
            "North Indian & Mughlai",
            "South Indian Delicacies",
            "Italian, Pizza & Pasta",
            "Pan-Asian & Chinese",
            "Continental & European",
            "Mexican & Tex-Mex",
            "Cafe, Bakery & Desserts",
            "Pure Vegetarian & Jain Menu",
            "Fast Food & Street Eats",
            "Barbecue & Grills",
          ],
          allowCustom: true,
        },
        {
          id: "popularDishes",
          label: "What are your popular signature dishes & specialties?",
          subtitle: "Highlight top recommendations that guests love to order.",
          type: "repeater",
          required: true,
          itemTitle: "Signature Dish",
          fields: [
            { key: "name", label: "Dish Name", placeholder: "e.g. Truffle Woodfired Pizza", type: "text", required: true },
            { key: "price", label: "Price", placeholder: "e.g. ₹480", type: "text" },
            { key: "description", label: "Description / Flavor Profile", placeholder: "e.g. Fresh burrata, wild mushrooms, white truffle oil", type: "text" },
          ],
        },
        {
          id: "menuAndPricing",
          label: "What is your average pricing and menu overview?",
          subtitle: "Average cost for two people, dietary options, and beverage offerings.",
          type: "textarea",
          required: true,
          placeholder: "Average cost: ₹900–₹1,400 for two people.\nIncludes appetizers, main course, artisanal beverages, and dessert. Full Jain, vegan, and gluten-sensitive menus available.",
        },
        {
          id: "openingHours",
          label: "What are your opening hours and meal slots?",
          subtitle: "Lunch, dinner, and weekend timings.",
          type: "textarea",
          required: true,
          placeholder: "Lunch: 12:00 PM – 03:30 PM (Daily)\nDinner: 07:00 PM – 11:30 PM (Daily)\nLate night cafe open until 01:00 AM on Fridays and Saturdays.",
        },
        {
          id: "deliveryTakeaway",
          label: "Do you offer takeaway and online delivery?",
          subtitle: "Direct ordering options, delivery partners (Zomato/Swiggy), packaging charges.",
          type: "textarea",
          required: false,
          placeholder: "Yes! Takeaway orders available with 15-minute preparation. Home delivery available directly via our website and on Zomato & Swiggy within a 7 km radius.",
        },
        {
          id: "groupDiningReservations",
          label: "Do you accommodate group dining, reservations, and private parties?",
          subtitle: "Table reservation policy, minimum group sizes, and party banquet booking.",
          type: "textarea",
          required: false,
          placeholder: "Table reservations can be booked online or via phone. We host private birthday parties, corporate dinners, and family celebrations up to 80 guests.",
        },
      ];

    case "hotel":
      return [
        {
          id: "roomCategories",
          label: "What room categories and suites are available?",
          subtitle: "List room types with nightly tariffs and key amenities.",
          type: "repeater",
          required: true,
          itemTitle: "Room Category",
          fields: [
            { key: "type", label: "Room Category", placeholder: "e.g. Deluxe Garden View Room", type: "text", required: true },
            { key: "price", label: "Price per Night", placeholder: "e.g. ₹4,500 + taxes", type: "text", required: true },
            { key: "capacity", label: "Max Occupancy", placeholder: "e.g. 2 Adults, 1 Child", type: "text" },
            { key: "highlights", label: "Highlights", placeholder: "e.g. King Bed, Balcony, Rain Shower, Free Breakfast", type: "text" },
          ],
        },
        {
          id: "facilities",
          label: "What facilities and property amenities do you offer?",
          subtitle: "Select amenities available on the premises for guests.",
          type: "multiselect",
          required: true,
          options: [
            "Complimentary High-Speed Wi-Fi",
            "Swimming Pool (Infinity / Heated)",
            "Multi-Cuisine In-House Restaurant",
            "Complimentary Buffet Breakfast",
            "Fitness Center / Gym",
            "Spa & Wellness Center",
            "24/7 Room Service",
            "Free Valet Parking",
            "Airport Pickup & Drop",
            "Conference & Banquet Hall",
          ],
          allowCustom: true,
        },
        {
          id: "timings",
          label: "What are your check-in and check-out timings?",
          subtitle: "Standard timings, early check-in, and late check-out guidelines.",
          type: "textarea",
          required: true,
          placeholder: "Check-in Time: 02:00 PM\nCheck-out Time: 11:00 AM\nEarly check-in from 10:00 AM and late check-out up to 02:00 PM are subject to room availability.",
        },
        {
          id: "hotelPolicies",
          label: "What are your hotel policies & reservation terms?",
          subtitle: "Cancellation rules, pet policy, child policies, and valid photo ID requirements.",
          type: "textarea",
          required: false,
          placeholder: "Free cancellation up to 48 hours before check-in. Valid government-issued photo ID (Aadhaar/Passport/Driving License) required at check-in for all adult guests. Non-smoking property.",
        },
        {
          id: "additionalServices",
          label: "What additional guest services do you provide?",
          subtitle: "Sightseeing tours, laundry, car rentals, or special occasion setups.",
          type: "textarea",
          required: false,
          placeholder: "Concierge travel desk, express laundry service, local heritage city tours, and customized candle-light dinner / anniversary room decor upon request.",
        },
      ];

    case "hospital":
      return [
        {
          id: "departments",
          label: "Which medical departments and specialty centers are available?",
          subtitle: "Select the major medical departments operated by the hospital.",
          type: "multiselect",
          required: true,
          options: [
            "Cardiology & Heart Care",
            "Orthopedics & Joint Replacement",
            "Neurology & Neurosurgery",
            "Pediatrics & Neonatology (NICU)",
            "Obstetrics & Gynecology",
            "Oncology (Cancer Care)",
            "Gastroenterology & Hepatology",
            "Nephrology & 24/7 Dialysis",
            "Pulmonology & Chest Medicine",
            "Emergency, Trauma & Critical Care",
          ],
          allowCustom: true,
        },
        {
          id: "specialists",
          label: "Which doctors and senior specialists are available?",
          subtitle: "Add key department heads, surgeons, and consulting doctors.",
          type: "repeater",
          required: false,
          itemTitle: "Specialist Consultant",
          fields: [
            { key: "name", label: "Doctor's Name", placeholder: "e.g. Dr. Alok Mehta", type: "text", required: true },
            { key: "department", label: "Department / Specialty", placeholder: "e.g. Chief Interventional Cardiologist", type: "text", required: true },
            { key: "opdTimings", label: "OPD Days & Hours", placeholder: "e.g. Mon, Wed, Fri 11 AM – 3 PM", type: "text" },
          ],
        },
        {
          id: "facilities",
          label: "What facilities, infrastructure, and patient amenities do you provide?",
          subtitle: "Key infrastructure available on hospital premises.",
          type: "multiselect",
          required: true,
          options: [
            "24/7 Emergency & Trauma Center",
            "Advanced Modular Operation Theatres",
            "ICU, CCU, and Neonatal NICU",
            "24/7 In-House Pharmacy",
            "24/7 Blood Bank",
            "Cashless TPA & Mediclaim Insurance Desk",
            "In-House Cafeteria & Patient Dining",
            "Dialysis Unit with Modern RO",
          ],
        },
        {
          id: "opdAndDiagnostics",
          label: "What are your OPD timings and diagnostic services?",
          subtitle: "Describe OPD consultation procedures and available medical imaging/labs.",
          type: "textarea",
          required: true,
          placeholder: "OPD Timings: Monday to Saturday, 09:00 AM – 06:00 PM.\nDiagnostic Services: 3T MRI, 128-Slice CT Scan, Digital X-Ray, 4D Ultrasound, 24/7 Automated Pathology & Biochemistry Labs.",
        },
        {
          id: "emergencyContact",
          label: "What are your emergency and ambulance contact details?",
          subtitle: "Critical 24/7 helpline numbers for immediate ambulance dispatch and trauma triage.",
          type: "textarea",
          required: true,
          placeholder: "24/7 Emergency Helpline: +91 98765 43210\nAmbulance Dispatch Hotline: +91 98765 43211\nDirect Emergency Admission Desk is operational 24 hours a day with zero wait time.",
        },
      ];

    case "retail-ecommerce":
      return [
        {
          id: "productCategories",
          label: "What product categories and collections do you sell?",
          subtitle: "Select the primary retail product lines offered by your brand.",
          type: "multiselect",
          required: true,
          options: [
            "Apparel & Fashion Wear",
            "Footwear & Casual Shoes",
            "Electronics & Tech Accessories",
            "Beauty, Skincare & Cosmetics",
            "Home Decor & Furnishings",
            "Kitchen & Home Appliances",
            "Jewelry & Watches",
            "Fitness & Sports Gear",
            "Gourmet & Organic Foods",
          ],
          allowCustom: true,
        },
        {
          id: "popularProducts",
          label: "What are your popular, best-selling, or featured products?",
          subtitle: "Add top products with prices so shoppers can browse direct highlights.",
          type: "repeater",
          required: false,
          itemTitle: "Featured Product",
          fields: [
            { key: "name", label: "Product Name", placeholder: "e.g. Wireless Active Noise-Cancelling Headphones", type: "text", required: true },
            { key: "price", label: "Price / Offer", placeholder: "e.g. ₹2,999 (MRP ₹4,999)", type: "text", required: true },
            { key: "description", label: "Key Features", placeholder: "e.g. 40-hour battery, Bluetooth 5.3, deep bass", type: "text" },
          ],
        },
        {
          id: "pricingAndOffers",
          label: "What are your prices, promotional discounts, and active offers?",
          subtitle: "Detail promo coupon codes, seasonal sales, and bundle savings.",
          type: "textarea",
          required: false,
          placeholder: "Flat 10% off on first order with code WELCOME10. Free shipping on all prepaid orders above ₹999. Buy 2 Get 1 Free on select essentials.",
        },
        {
          id: "shippingOptions",
          label: "What shipping options and delivery timelines do you provide?",
          subtitle: "Courier partners, standard vs express delivery days, and shipping charges.",
          type: "textarea",
          required: true,
          placeholder: "Metro cities: 2–3 business days.\nRest of India: 4–6 business days.\nStandard delivery fee is ₹60 (Free above ₹999). Express same-day delivery available in select cities.",
        },
        {
          id: "returnPolicy",
          label: "What is your return, exchange, and refund policy?",
          subtitle: "Return window, condition requirements, and refund turnaround.",
          type: "textarea",
          required: true,
          placeholder: "Hassle-free 7-day return and exchange policy from the date of delivery. Items must be unused with original tags intact. Refunds processed to original payment method within 3–5 working days.",
        },
        {
          id: "paymentMethods",
          label: "What payment methods do you accept?",
          subtitle: "Payment gateways, digital wallets, cards, and COD availability.",
          type: "multiselect",
          required: true,
          options: [
            "UPI (Google Pay, PhonePe, Paytm)",
            "Credit & Debit Cards (Visa, Mastercard, RuPay)",
            "Net Banking (All Major Indian Banks)",
            "Cash on Delivery (COD)",
            "Cardless & Debit Card EMI",
            "Digital Wallets",
          ],
        },
      ];

    case "professional-services":
      return [
        {
          id: "servicesProvided",
          label: "What professional services and packages do you provide?",
          subtitle: "Add core service offerings with deliverables and estimated timelines.",
          type: "repeater",
          required: true,
          itemTitle: "Service Offering",
          fields: [
            { key: "name", label: "Service Name", placeholder: "e.g. Corporate GST & Tax Filing", type: "text", required: true },
            { key: "pricing", label: "Starting Fee / Retainer", placeholder: "e.g. ₹5,000 / month", type: "text" },
            { key: "timeline", label: "Turnaround Time", placeholder: "e.g. 3–5 business days", type: "text" },
            { key: "description", label: "Scope & Deliverables", placeholder: "e.g. Monthly reconciliation, filing, audit support", type: "text" },
          ],
        },
        {
          id: "targetClients",
          label: "Who are your target clients and industries served?",
          subtitle: "Describe the ideal clients you work with (e.g. Startups, SMEs, HNIs).",
          type: "textarea",
          required: true,
          placeholder: "We cater primarily to tech startups, growing SMEs, manufacturing firms, and retail businesses looking for compliant, scalable financial and corporate legal advisory.",
        },
        {
          id: "pricingModels",
          label: "What are your service charges & engagement models?",
          subtitle: "Hourly rates, fixed-price contracts, or monthly advisory retainers.",
          type: "textarea",
          required: false,
          placeholder: "Flexible engagement: Monthly Retainers (starting ₹15,000/mo), Fixed Scope Projects (milestone billing), and Hourly Advisory (₹2,500/hr).",
        },
        {
          id: "workingProcess",
          label: "What is your typical working process & project phases?",
          subtitle: "Step-by-step methodology from initial inquiry to final delivery.",
          type: "textarea",
          required: true,
          placeholder: "Step 1: Free 30-minute discovery consultation.\nStep 2: Formal scope proposal & NDA.\nStep 3: Execution & weekly sprint review.\nStep 4: Final delivery, sign-off, and ongoing support.",
        },
        {
          id: "consultationBooking",
          label: "How can prospective clients request a consultation?",
          subtitle: "Booking links, discovery call process, and standard response time.",
          type: "textarea",
          required: true,
          placeholder: "Clients can schedule an initial video consultation through our booking link or drop an email. Our senior partners respond within 4 business hours.",
        },
      ];

    case "other":
    default:
      return [
        {
          id: "businessDomain",
          label: "What is your specific business domain and primary offering?",
          subtitle: "Describe what your business does and the problems you solve for clients.",
          type: "textarea",
          required: true,
          placeholder: "Describe your company, main products or services, target customers, and unique value proposition...",
        },
        {
          id: "offerings",
          label: "What are your main products, services, or packages?",
          subtitle: "Add specific offerings with descriptions and pricing.",
          type: "repeater",
          required: true,
          itemTitle: "Offering",
          fields: [
            { key: "name", label: "Offering / Service Name", placeholder: "e.g. Commercial Interior Design", type: "text", required: true },
            { key: "pricing", label: "Price / Estimate", placeholder: "e.g. ₹1,200 per sq.ft.", type: "text" },
            { key: "description", label: "Description", placeholder: "e.g. Concept design, 3D renders, turnkey execution", type: "text" },
          ],
        },
        {
          id: "pricingStructure",
          label: "What is your pricing structure & accepted payment methods?",
          subtitle: "Rates, estimate process, discounts, and payment terms.",
          type: "textarea",
          required: false,
          placeholder: "Provide typical price ranges, minimum project sizes, payment terms (e.g. 50% advance), and accepted payment methods.",
        },
        {
          id: "operationsSchedule",
          label: "What are your working hours and customer response times?",
          subtitle: "Operating days, emergency support availability, and office hours.",
          type: "textarea",
          required: true,
          placeholder: "Monday to Saturday, 09:30 AM to 06:30 PM. Inquiries submitted outside hours are answered first thing the next business morning.",
        },
        {
          id: "howToOrder",
          label: "How do customers get started or place an order?",
          subtitle: "The typical client onboarding journey or ordering steps.",
          type: "textarea",
          required: true,
          placeholder: "Step 1: Contact via chat or phone.\nStep 2: Custom quotation provided within 24 hours.\nStep 3: Approval and project kickoff.",
        },
        {
          id: "policiesAndFaqs",
          label: "What are your important business policies, warranties, or FAQs?",
          subtitle: "Any guarantees, cancellation terms, or common client questions.",
          type: "textarea",
          required: false,
          placeholder: "100% satisfaction guarantee. 1-year warranty on workmanship. Full refunds available prior to project kickoff.",
        },
      ];
  }
}

/**
 * Synthesizes all collected wizard information into a structured, comprehensive
 * Markdown knowledge profile suitable for vector chunking and RAG retrieval.
 */
export function generateKnowledgeMarkdown({ industry, commonDetails = {}, questionnaireAnswers = {}, assistantConfig = {} }) {
  const ind = INDUSTRIES.find((i) => i.id === industry) || INDUSTRIES.find((i) => i.id === "other");
  const businessName = commonDetails.businessName || "My Business";

  let md = `# ${businessName} — Verified Approved Business Knowledge Base\n\n`;
  md += `> **Industry**: ${ind?.name || "Business"} (${ind?.category || "Enterprise"})\n`;
  md += `> **Document Type**: Official Business Knowledge Profile & Ingested QA Base\n`;
  md += `> **Ingestion Status**: Approved for Autonomous AI Response Generation\n\n`;

  md += `## 1. Business Identity & Overview\n`;
  md += `- **Business Name**: ${businessName}\n`;
  if (commonDetails.tagline) md += `- **Tagline**: ${commonDetails.tagline}\n`;
  md += `- **Industry Category**: ${ind?.name || "General Business"}\n`;
  if (commonDetails.description) md += `- **About the Business**: ${commonDetails.description}\n`;
  if (commonDetails.websiteUrl) md += `- **Official Website**: ${commonDetails.websiteUrl}\n`;
  if (commonDetails.businessEmail) md += `- **Official Email**: ${commonDetails.businessEmail}\n`;
  if (commonDetails.phoneNumber) md += `- **Phone & WhatsApp**: ${commonDetails.phoneNumber}\n`;
  if (commonDetails.businessAddress) md += `- **Physical Address / Location**: ${commonDetails.businessAddress}\n`;
  if (commonDetails.workingDaysHours) md += `- **Operational Hours & Schedule**: ${commonDetails.workingDaysHours}\n`;
  if (commonDetails.mainOfferings) md += `- **Core Offerings**: ${commonDetails.mainOfferings}\n`;
  md += `\n`;

  md += `## 2. Industry-Specific Operations & Catalog\n\n`;

  const questions = getIndustryQuestions(industry);
  questions.forEach((q, idx) => {
    const val = questionnaireAnswers[q.id];
    if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) return;

    md += `### 2.${idx + 1} ${q.label}\n`;

    if (Array.isArray(val)) {
      if (typeof val[0] === "object") {
        // Repeater table
        val.forEach((item, itemIdx) => {
          md += `\n**Entry ${itemIdx + 1}**:\n`;
          Object.entries(item).forEach(([k, v]) => {
            if (v) {
              const label = q.fields?.find((f) => f.key === k)?.label || k;
              md += `- **${label}**: ${v}\n`;
            }
          });
        });
      } else {
        // Multiselect list
        val.forEach((item) => {
          md += `- ${item}\n`;
        });
      }
    } else {
      md += `${val}\n`;
    }
    md += `\n`;
  });

  // Healthcare specific advisory clause in knowledge
  if (industry === "clinic" || industry === "hospital") {
    md += `## 3. Healthcare Informational Policy & Disclaimers\n`;
    md += `- **Informational Boundary**: All medical information provided by this assistant is strictly informational and educational.\n`;
    md += `- **No Medical Diagnosis**: The assistant does not diagnose illnesses, prescribe medicines, or replace an examination by a qualified medical professional.\n`;
    md += `- **Emergency Disclaimer**: In the event of a medical emergency, severe trauma, chest pain, or breathing difficulty, patients must immediately contact emergency services or visit the nearest hospital emergency room.\n\n`;
  }

  md += `## 4. Assistant Persona & Communication Style\n`;
  md += `- **Assistant Name**: ${assistantConfig.name || ind?.defaultBotName || "AI Assistant"}\n`;
  md += `- **Personality**: ${assistantConfig.personality || "Helpful & Professional"}\n`;
  md += `- **Welcome Greeting**: ${assistantConfig.welcomeMessage || ind?.defaultWelcomeMessage || "Hello! How can I help you today?"}\n`;

  return md;
}

/**
 * Builds the initial tailored systemPrompt based on industry and user config.
 */
export function generateIndustrySystemPrompt({ industry, commonDetails = {}, questionnaireAnswers = {}, assistantConfig = {} }) {
  const businessName = commonDetails.businessName || "the business";
  const assistantName = assistantConfig.name || "AI Assistant";
  const personality = assistantConfig.personality || "Helpful & Professional";
  const phone = commonDetails.phoneNumber || "";
  const email = commonDetails.businessEmail || "";
  const website = commonDetails.websiteUrl || "";

  let prompt = `You are ${assistantName}, the official AI assistant for ${businessName}.\n`;
  prompt += `Tone and Personality: ${personality}.\n`;
  prompt += `Business Scope: Represent ${businessName} accurately, warmly, and with verified authority based on the business knowledge profile.\n`;

  if (commonDetails.description) {
    prompt += `Company Background: ${commonDetails.description}\n`;
  }
  if (commonDetails.workingDaysHours) {
    prompt += `Business Schedule: ${commonDetails.workingDaysHours}\n`;
  }
  if (phone) prompt += `Official Phone / WhatsApp: ${phone}\n`;
  if (email) prompt += `Official Email: ${email}\n`;
  if (website) prompt += `Official Website: ${website}\n`;

  prompt += `\nCORE INSTRUCTIONS:\n`;
  prompt += `1. Answer customer questions directly, clearly, and concisely using verified business knowledge.\n`;
  prompt += `2. Never invent unapproved services, prices, property listings, doctor schedules, or discounts.\n`;
  prompt += `3. If an inquiry asks about details not covered in your knowledge base, politely provide official contact details (${phone || email || "our office"}).\n`;
  prompt += `4. Support English, Hindi, and Hinglish dynamically matching the visitor's language.\n`;

  if (industry === "clinic" || industry === "hospital") {
    prompt += `\nSTRICT HEALTHCARE GUARDRAILS (CRITICAL):\n`;
    prompt += `- You are an informational assistant for ${businessName}. You can help with doctor specialties, consultation hours, appointment booking procedures, and clinic facilities.\n`;
    prompt += `- You MUST NEVER provide clinical diagnosis, interpret laboratory results as medical verdicts, or prescribe medication dosages.\n`;
    prompt += `- Always advise patients that online information does not replace in-person consultation with a licensed doctor.\n`;
    prompt += `- For emergencies (e.g. chest pain, severe bleeding, breathing distress), instruct visitors immediately to call emergency medical services or proceed directly to the nearest hospital emergency room.\n`;
  }

  return prompt;
}
