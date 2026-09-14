"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi" | "pa" | "bho" | "hr";

export interface Translations {
  nav: {
    dashboard: string;
    diseaseDetection: string;
    weather: string;
    marketPrices: string;
    cropAdvisor: string;
    aiAssistant: string;
    profile: string;
    economics: string;
    farmMap: string;
  };
  common: {
    selectLanguage: string;
    search: string;
    loading: string;
    error: string;
    locationBadge: string;
  };
  dashboard: {
    badge: string;
    title: string;
    subtitle: string;
    quickActions: string;
    statDisease: string;
    statWeather: string;
    statMarket: string;
    statAdvisor: string;
    ctaAnalyze: string;
    ctaWeather: string;
    ctaMarket: string;
    ctaAdvisor: string;
    ctaChat: string;
    ctaProfile: string;
    ctaEconomics: string;
    whatShouldIDoToday: string;
    yourFarm: string;
    todayPlan: string;
    highPriority: string;
    recommended: string;
    optional: string;
    next3Days: string;
    next7Days: string;
    watchFor: string;
    avoid: string;
    expertHelp: string;
  };
  disease: {
    badge: string;
    title: string;
    subtitle: string;
    uploadBox: string;
    uploadBtn: string;
    dragDrop: string;
    analyzing: string;
    resultsTitle: string;
    cropIdentified: string;
    diseaseFound: string;
    confidence: string;
    severity: string;
    symptoms: string;
    treatment: string;
    prevention: string;
    disclaimer: string;
  };
  chat: {
    title: string;
    subtitle: string;
    placeholder: string;
    send: string;
    quickQuestions: string;
    thinking: string;
  };
  advisor: {
    badge: string;
    title: string;
    subtitle: string;
    region: string;
    season: string;
    soilType: string;
    water: string;
    submit: string;
    recommendations: string;
  };
  weather: {
    badge: string;
    title: string;
    subtitle: string;
    useLocation: string;
    searchCity: string;
    humidity: string;
    windSpeed: string;
    rainProbability: string;
    uvIndex: string;
    warnings: string;
    forecast: string;
    agroguardSays: string;
    agroguardIntelligenceTitle: string;
    weatherUnavailable: string;
  };
  market: {
    badge: string;
    title: string;
    subtitle: string;
    selectCrop: string;
    selectState: string;
    mandi: string;
    minPrice: string;
    maxPrice: string;
    modalPrice: string;
    sevenDayTrend: string;
    bestNearbyMarket: string;
    dataUpdated: string;
    agroguardInsightTitle: string;
    sellingConsiderations: string;
    marketUnavailable: string;
  };
  profile: {
    badge: string;
    title: string;
    subtitle: string;
    personalDetails: string;
    farmerName: string;
    preferredLanguage: string;
    locationSection: string;
    state: string;
    district: string;
    village: string;
    landSection: string;
    landArea: string;
    landUnit: string;
    soilType: string;
    irrigationSection: string;
    irrigationAvailable: string;
    irrigationType: string;
    cropSection: string;
    currentCrop: string;
    cropVariety: string;
    growthStage: string;
    sowingDate: string;
    financialSection: string;
    budget: string;
    experience: string;
    previousCrop: string;
    notes: string;
    saveBtn: string;
    saving: string;
    savedSuccess: string;
    farmMemorySummary: string;
  };
  economics: {
    badge: string;
    title: string;
    subtitle: string;
    landBadge: string;
    estimatedCost: string;
    expectedProduction: string;
    potentialRevenue: string;
    estimatedMargin: string;
    costBreakdownTitle: string;
    howCalculatedBtn: string;
    howCalculatedTitle: string;
    simulatorTitle: string;
    customCrop: string;
    customArea: string;
    customUnit: string;
    customPrice: string;
    recalculateBtn: string;
    verifiedDataTag: string;
    estimatedDataTag: string;
    unavailableDataTag: string;
    disclaimerTitle: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      diseaseDetection: "Disease Detection",
      weather: "Weather",
      marketPrices: "Market Prices",
      cropAdvisor: "Crop Advisor",
      aiAssistant: "AI Assistant",
      profile: "Farm Profile",
      economics: "Farm Economics",
      farmMap: "Virtual Farm Map",
    },
    common: {
      selectLanguage: "Language",
      search: "Search",
      loading: "Loading...",
      error: "Error occurred",
      locationBadge: "Punjab, India",
    },
    dashboard: {
      badge: "AI Agronomy Platform",
      title: "Smart Agriculture & Crop Health Intelligence",
      subtitle: "Empowering farmers with AI leaf disease diagnosis, live weather spore risk advisories, mandi prices, and expert crop planning.",
      quickActions: "Platform Features",
      statDisease: "Instant Leaf Diagnosis",
      statWeather: "Live Weather & Spore Risk",
      statMarket: "Real-time Mandi Prices",
      statAdvisor: "Tailored Crop Planning",
      ctaAnalyze: "Diagnose Disease",
      ctaWeather: "Check Weather",
      ctaMarket: "View Mandi Rates",
      ctaAdvisor: "Get Crop Advice",
      ctaChat: "Ask AI Assistant",
      ctaProfile: "Manage Farm Memory",
      ctaEconomics: "Farm Economics",
      whatShouldIDoToday: "What should I do today?",
      yourFarm: "Your Farm Status",
      todayPlan: "Today's Action Plan",
      highPriority: "High Priority",
      recommended: "Recommended",
      optional: "Optional",
      next3Days: "Next 3 Days Outlook",
      next7Days: "Next 7 Days Outlook",
      watchFor: "Watch For",
      avoid: "Avoid",
      expertHelp: "Consult Local Expert When",
    },
    disease: {
      badge: "Gemini Vision Plant Pathology Engine",
      title: "AI Crop Disease Detection",
      subtitle: "Upload a clear photo of an affected plant leaf for immediate AI diagnosis, symptoms, and organic/chemical remedies.",
      uploadBox: "Upload Crop Leaf Photograph",
      uploadBtn: "Select Photo from Device",
      dragDrop: "PNG, JPG, or WEBP images supported",
      analyzing: "Analyzing leaf structure with Gemini Vision AI...",
      resultsTitle: "Diagnostic Report",
      cropIdentified: "Identified Crop",
      diseaseFound: "Detected Condition",
      confidence: "Confidence Level",
      severity: "Disease Severity",
      symptoms: "Visible Symptoms",
      treatment: "Recommended Treatments & Remedies",
      prevention: "Agronomic Prevention Plan",
      disclaimer: "Disclaimer: AI assistance only. For severe damage, consult local KVK experts.",
    },
    chat: {
      title: "AgroGuard AI Assistant",
      subtitle: "Multimodal Gemini Agricultural Scientist",
      placeholder: "Ask AgroGuard about crop leaves, pests, weather, or mandi prices...",
      send: "Send",
      quickQuestions: "Quick Questions:",
      thinking: "AgroGuard AI is generating advice...",
    },
    advisor: {
      badge: "Agronomic Decision System",
      title: "Intelligent Crop Advisor",
      subtitle: "Receive AI-guided crop recommendations tailored specifically to your farm region, soil type, and water resources.",
      region: "Farm Region / State",
      season: "Farming Season",
      soilType: "Soil Type",
      water: "Water Availability",
      submit: "Generate AI Crop Plan",
      recommendations: "Recommended Crops",
    },
    weather: {
      badge: "Agricultural Microclimate Engine",
      title: "Farm Weather & Spore Warnings",
      subtitle: "Get hyper-local temperature, dew point, spray window recommendations, and fungal disease risk warnings.",
      useLocation: "Use My Current Location",
      searchCity: "Enter City / District...",
      humidity: "Humidity",
      windSpeed: "Wind Speed",
      rainProbability: "Rain Chance",
      uvIndex: "UV Index",
      warnings: "Agricultural Risk & Spray Advisory",
      forecast: "5-Day Agricultural Forecast",
      agroguardSays: "AgroGuard Says...",
      agroguardIntelligenceTitle: "Weather-Aware Farming Intelligence",
      weatherUnavailable: "Weather Service Unavailable. Live weather data could not be retrieved.",
    },
    market: {
      badge: "Mandi Price Intelligence",
      title: "Real-time Commodity Mandi Prices",
      subtitle: "Track daily wholesale market rates, minimum and maximum prices, and mandi trends across states.",
      selectCrop: "Select Crop Filter",
      selectState: "Select State Filter",
      mandi: "Mandi Name",
      minPrice: "Min Price",
      maxPrice: "Max Price",
      modalPrice: "Modal Rate (₹/Qtl)",
      sevenDayTrend: "7-Day Trend",
      bestNearbyMarket: "Best Observed Nearby Market",
      dataUpdated: "Data Updated",
      agroguardInsightTitle: "AgroGuard Market Insight",
      sellingConsiderations: "Selling Considerations & Analysis",
      marketUnavailable: "Market Service Unavailable. Live mandi rates could not be retrieved.",
    },
    profile: {
      badge: "Farm Intelligence & Context",
      title: "Farmer Profile & Farm Memory",
      subtitle: "Configure your farm details so AgroGuard provides precise advice tailored specifically to your land, soil, irrigation, and crop.",
      personalDetails: "Farmer Details",
      farmerName: "Farmer Name",
      preferredLanguage: "Preferred Language",
      locationSection: "Location & Geography",
      state: "State",
      district: "District",
      village: "Village / Location",
      landSection: "Land & Soil Resources",
      landArea: "Land Area",
      landUnit: "Land Unit",
      soilType: "Soil Type",
      irrigationSection: "Irrigation & Water Access",
      irrigationAvailable: "Irrigation Facilities Available",
      irrigationType: "Irrigation Method",
      cropSection: "Current Crop Details",
      currentCrop: "Current Crop",
      cropVariety: "Crop Variety (if known)",
      growthStage: "Growth Stage",
      sowingDate: "Sowing Date",
      financialSection: "Farming Budget & Experience",
      budget: "Seasonal Budget (₹)",
      experience: "Farming Experience (Years)",
      previousCrop: "Previous Crop Grown",
      notes: "Farm Notes & Observations",
      saveBtn: "Save Farm Memory",
      saving: "Saving Profile...",
      savedSuccess: "Farm profile and context saved successfully!",
      farmMemorySummary: "Active Farm Memory Context",
    },
    economics: {
      badge: "Land-Area Personalization Engine",
      title: "💰 Farm Economics & Requirements",
      subtitle: "Deterministic economic calculations scaled directly to your exact farm size. Know your total seeds, fertilizers, input costs, expected yield, and profit margin.",
      landBadge: "Land Standardized",
      estimatedCost: "Estimated Input Cost",
      expectedProduction: "Expected Production",
      potentialRevenue: "Potential Revenue",
      estimatedMargin: "Estimated Profit Margin",
      costBreakdownTitle: "Itemized Farm Input Cost Breakdown",
      howCalculatedBtn: "How was this calculated?",
      howCalculatedTitle: "Step-by-Step Agronomic Calculation & Assumptions",
      simulatorTitle: "Interactive Land & Crop Economics Simulator",
      customCrop: "Select Crop",
      customArea: "Land Size",
      customUnit: "Unit",
      customPrice: "Custom Market Rate (₹/Qtl)",
      recalculateBtn: "Calculate Farm Economics",
      verifiedDataTag: "VERIFIED DATA",
      estimatedDataTag: "ESTIMATED DATA",
      unavailableDataTag: "UNAVAILABLE DATA",
      disclaimerTitle: "Financial & Yield Disclaimer",
    },
  },

  hi: {
    nav: {
      dashboard: "डैशबोर्ड",
      diseaseDetection: "फसल रोग पहचान",
      weather: "मौसम अलर्ट",
      marketPrices: "मंडी भाव",
      cropAdvisor: "फसल सलाहकार",
      aiAssistant: "एआई सहायक",
      profile: "किसान प्रोफाइल",
      economics: "खेत अर्थशास्त्र",
      farmMap: "खेत मानचित्र",
    },
    common: {
      selectLanguage: "भाषा चुनें",
      search: "खोजें",
      loading: "लोड हो रहा है...",
      error: "त्रुटि हुई",
      locationBadge: "पंजाब, भारत",
    },
    dashboard: {
      badge: "एआई कृषि मंच",
      title: "स्मार्ट कृषि एवं फसल स्वास्थ्य इंटेलिजेंस",
      subtitle: "जेमिनी एआई द्वारा पत्ती रोग निदान, लाइव मौसम जोखिम चेतावनी, मंडी भाव और विशेषज्ञ फसल सलाह से किसानों को सशक्त बनाना।",
      quickActions: "मुख्य सेवाएं",
      statDisease: "तुरंत पत्ती रोग निदान",
      statWeather: "मौसम व फफूंद जोखिम",
      statMarket: "ताज़ा मंडी भाव",
      statAdvisor: "सटीक फसल योजना",
      ctaAnalyze: "रोग पहचानें",
      ctaWeather: "मौसम देखें",
      ctaMarket: "मंडी भाव देखें",
      ctaAdvisor: "फसल सलाह लें",
      ctaChat: "एआई से पूछें",
      ctaProfile: "खेत विवरण प्रबंधित करें",
      ctaEconomics: "खेत लागत व मुनाफा",
      whatShouldIDoToday: "आज मुझे क्या करना चाहिए?",
      yourFarm: "आपके खेत की स्थिति",
      todayPlan: "आज की कृषि कार्य योजना",
      highPriority: "उच्च प्राथमिकता",
      recommended: "अनुशंसित कार्य",
      optional: "सामान्य कार्य",
      next3Days: "अगले 3 दिनों की योजना",
      next7Days: "अगले 7 दिनों की योजना",
      watchFor: "सावधानी रखें (ध्यान दें)",
      avoid: "क्या न करें (बचें)",
      expertHelp: "कृषि विशेषज्ञ / KVK से कब संपर्क करें",
    },
    disease: {
      badge: "जेमिनी विज़न पादप रोग विज्ञान",
      title: "एआई फसल रोग पहचान",
      subtitle: "सटीक एआई जांच, लक्षण और जैविक/रासायनिक उपचार हेतु प्रभावित पौधे की पत्ती की फोटो अपलोड करें।",
      uploadBox: "फसल पत्ती की फोटो अपलोड करें",
      uploadBtn: "डिवाइस से फोटो चुनें",
      dragDrop: "PNG, JPG या WEBP फोटो समर्थित",
      analyzing: "जेमिनी एआई द्वारा पत्ती की जांच की जा रही है...",
      resultsTitle: "रोग निदान रिपोर्ट",
      cropIdentified: "पहचानी गई फसल",
      diseaseFound: "पाया गया रोग",
      confidence: "सटीकता स्तर",
      severity: "रोग की गंभीरता",
      symptoms: "दिखने वाले लक्षण",
      treatment: "अनुशंसित उपचार व दवाएं",
      prevention: "भविष्य से बचाव की योजना",
      disclaimer: "अस्वीकरण: केवल एआई सहायता। गंभीर स्थिति में कृषि विज्ञान केंद्र (KVK) से संपर्क करें।",
    },
    chat: {
      title: "एग्रोगार्ड एआई सहायक",
      subtitle: "कृषि वैज्ञानिक जेमिनी एआई",
      placeholder: "फसल, कीड़े, मौसम या मंडी भाव के बारे में पूछें...",
      send: "भेजें",
      quickQuestions: "त्वरित प्रश्न:",
      thinking: "एग्रोगार्ड एआई सलाह तैयार कर रहा है...",
    },
    advisor: {
      badge: "कृषि निर्णय प्रणाली",
      title: "बुद्धिमान फसल सलाहकार",
      subtitle: "अपने क्षेत्र, मिट्टी के प्रकार और सिंचाई संसाधनों के अनुसार सर्वोत्तम फसल सिफारिशें प्राप्त करें।",
      region: "क्षेत्र / राज्य",
      season: "बुआई का मौसम",
      soilType: "मिट्टी का प्रकार",
      water: "सिंचाई जल की उपलब्धता",
      submit: "एआई फसल योजना बनाएं",
      recommendations: "अनुशंसित फसलें",
    },
    weather: {
      badge: "कृषि मौसम इंजन",
      title: "मौसम एवं फफूंद चेतावनी",
      subtitle: "तापमान, आर्द्रता, छिड़काव का सही समय और फफूंद रोग की चेतावनी प्राप्त करें।",
      useLocation: "मेरा वर्तमान स्थान चुनें",
      searchCity: "शहर या जिला दर्ज करें...",
      humidity: "नमी (आर्द्रता)",
      windSpeed: "हवा की गति",
      rainProbability: "बारिश की संभावना",
      uvIndex: "यूवी इंडेक्स",
      warnings: "कृषि जोखिम व छिड़काव सलाह",
      forecast: "5-दिवसीय मौसम पूर्वानुमान",
      agroguardSays: "एग्रोगार्ड की सलाह...",
      agroguardIntelligenceTitle: "मौसम-आधारित कृषि सलाह",
      weatherUnavailable: "मौसम सेवा उपलब्ध नहीं है। लाइव डेटा प्राप्त नहीं किया जा सका।",
    },
    market: {
      badge: "मंडी भाव जानकारी",
      title: "लाइव मंडी भाव एवं दरें",
      subtitle: "विभिन्न राज्यों और मंडियों में फसलों के न्यूनतम, अधिकतम और मॉडल भाव देखें।",
      selectCrop: "फसल चुनें",
      selectState: "राज्य चुनें",
      mandi: "मंडी का नाम",
      minPrice: "न्यूनतम मूल्य",
      maxPrice: "अधिकतम मूल्य",
      modalPrice: "मॉडल भाव (₹/क्विंटल)",
      sevenDayTrend: "7-दिवसीय रुझान",
      bestNearbyMarket: "निकटतम मंडी का सर्वोत्तम भाव",
      dataUpdated: "अंतिम अपडेट",
      agroguardInsightTitle: "एग्रोगार्ड मंडी विश्लेषण",
      sellingConsiderations: "फसल बिक्री संबंधी विचार व विश्लेषण",
      marketUnavailable: "मंडी सेवा उपलब्ध नहीं है। लाइव भाव प्राप्त नहीं किया जा सका।",
    },
    profile: {
      badge: "खेत मेमोरी एवं प्रोफाइल",
      title: "किसान प्रोफाइल और खेत मेमोरी",
      subtitle: "अपने खेत और मिट्टी की जानकारी दर्ज करें ताकि एग्रोगार्ड आपकी जमीन और फसल के अनुसार सटीक सलाह दे सके।",
      personalDetails: "किसान विवरण",
      farmerName: "किसान का नाम",
      preferredLanguage: "पसंदीदा भाषा",
      locationSection: "स्थान और क्षेत्र",
      state: "राज्य",
      district: "ज़िला",
      village: "गांव / स्थान",
      landSection: "जमीन और मिट्टी",
      landArea: "कुल जमीन का क्षेत्रफल",
      landUnit: "इकाई",
      soilType: "मिट्टी का प्रकार",
      irrigationSection: "सिंचाई संसाधन",
      irrigationAvailable: "सिंचाई सुविधा उपलब्ध",
      irrigationType: "सिंचाई का साधन",
      cropSection: "वर्तमान फसल विवरण",
      currentCrop: "वर्तमान फसल",
      cropVariety: "फसल की किस्म (यदि पता हो)",
      growthStage: "फसल की अवस्था",
      sowingDate: "बुआई की तारीख",
      financialSection: "बजट एवं अनुभव",
      budget: "अनुमानित बजट (₹)",
      experience: "खेती का अनुभव (वर्ष)",
      previousCrop: "पिछली फसल",
      notes: "खेत की विशेष टिप्पणियां",
      saveBtn: "फार्म मेमोरी सहेजें",
      saving: "सहेजा जा रहा है...",
      savedSuccess: "किसान प्रोफाइल सफलता पूर्वक सहेज ली गई है!",
      farmMemorySummary: "सक्रिय फार्म मेमोरी संदर्भ",
    },
    economics: {
      badge: "जमीन आकार आधारित गणना",
      title: "💰 खेत अर्थशास्त्र एवं आवश्यकताएं",
      subtitle: "आपकी अपनी जमीन के कुल आकार के अनुसार बीज, खाद, सिंचाई, कुल लागत, संभावित पैदावार और अनुमानित मुनाफे की सटीक गणना।",
      landBadge: "जमीन का क्षेत्रफल",
      estimatedCost: "अनुमानित कुल लागत",
      expectedProduction: "अनुमानित पैदावार",
      potentialRevenue: "संभावित कुल आय",
      estimatedMargin: "अनुमानित शुद्ध मुनाफा",
      costBreakdownTitle: "मदवार खेत लागत विवरण",
      howCalculatedBtn: "यह गणना कैसे की गई?",
      howCalculatedTitle: "चरण-दर-चरण कृषि सूत्र एवं धारणाएं",
      simulatorTitle: "इंटरएक्टिव खेत व फसल कैलकुलेटर",
      customCrop: "फसल चुनें",
      customArea: "जमीन का आकार",
      customUnit: "इकाई",
      customPrice: "मंडी भाव (₹/क्विंटल)",
      recalculateBtn: "गणना करें",
      verifiedDataTag: "प्रमाणित डेटा",
      estimatedDataTag: "अनुमानित डेटा",
      unavailableDataTag: "अनुपलब्ध डेटा",
      disclaimerTitle: "वित्तीय व पैदावार चेतावनी",
    },
  },

  pa: {
    nav: {
      dashboard: "ਡੈਸ਼ਬੋਰਡ",
      diseaseDetection: "ਫਸਲ ਬਿਮਾਰੀ ਜਾਂਚ",
      weather: "ਮੌਸਮ ਅਲਰਟ",
      marketPrices: "ਮੰਡੀ ਭਾਅ",
      cropAdvisor: "ਫਸਲ ਸਲਾਹਕਾਰ",
      aiAssistant: "ਏਆਈ ਸਹਾਇਕ",
      profile: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ",
      economics: "ਖੇਤ ਆਰਥਿਕਤਾ",
      farmMap: "ਖੇਤ ਨਕਸ਼ਾ",
    },
    common: {
      selectLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
      search: "ਖੋਜੋ",
      loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
      error: "ਗਲਤੀ ਹੋਈ",
      locationBadge: "ਪੰਜਾਬ, ਭਾਰਤ",
    },
    dashboard: {
      badge: "ਏਆਈ ਖੇਤੀਬਾੜੀ ਮੰਚ",
      title: "ਸਮਾਰਟ ਖੇਤੀਬਾੜੀ ਅਤੇ ਫਸਲ ਸਿਹਤ ਜਾਣਕਾਰੀ",
      subtitle: "ਜੈਮਿਨੀ ਏਆਈ ਦੁਆਰਾ ਪੱਤਾ ਬਿਮਾਰੀ ਜਾਂਚ, ਲਾਈਵ ਮੌਸਮ ਖਤਰਾ ਚੇਤਾਵਨੀ, ਮੰਡੀ ਭਾਅ ਅਤੇ ਖੇਤੀ ਸਲਾਹ।",
      quickActions: "ਮੁੱਖ ਸੇਵਾਵਾਂ",
      statDisease: "ਤੁਰੰਤ ਪੱਤਾ ਬਿਮਾਰੀ ਜਾਂਚ",
      statWeather: "ਮੌਸਮ ਤੇ ਉੱਲੀ ਖਤਰਾ",
      statMarket: "ਤਾਜ਼ਾ ਮੰਡੀ ਭਾਅ",
      statAdvisor: "ਸਹੀ ਫਸਲ ਯੋਜਨਾ",
      ctaAnalyze: "ਬਿਮਾਰੀ ਪਛਾਣੋ",
      ctaWeather: "ਮੌਸਮ ਵੇਖੋ",
      ctaMarket: "ਮੰਡੀ ਭਾਅ ਵੇਖੋ",
      ctaAdvisor: "ਫਸਲ ਸਲਾਹ ਲਓ",
      ctaChat: "ਏਆਈ ਤੋਂ ਪੁੱਛੋ",
      ctaProfile: "ਖੇਤ ਪ੍ਰੋਫਾਈਲ ਬਣਾਓ",
      ctaEconomics: "ਖੇਤ ਖਰਚਾ ਤੇ ਮੁਨਾਫਾ",
      whatShouldIDoToday: "ਅੱਜ ਮੈਨੂੰ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?",
      yourFarm: "ਤੁਹਾਡੇ ਖੇਤ ਦੀ ਸਥਿਤੀ",
      todayPlan: "ਅੱਜ ਦੀ ਖੇਤੀਬਾੜੀ ਕਾਰਜ ਯੋਜਨਾ",
      highPriority: "ਜ਼ਰੂਰੀ (ਪਹਿਲ)",
      recommended: "ਸਿਫਾਰਸ਼ੀ ਕੰਮ",
      optional: "ਆਮ ਕੰਮ",
      next3Days: "ਅਗਲੇ 3 ਦਿਨਾਂ ਦੀ ਯੋਜਨਾ",
      next7Days: "ਅਗਲੇ 7 ਦਿਨਾਂ ਦੀ ਯੋਜਨਾ",
      watchFor: "ਧਿਆਨ ਰੱਖੋ",
      avoid: "ਕੀ ਨਾ ਕਰੋ (ਬਚੋ)",
      expertHelp: "ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ ਨਾਲ ਕਦੋਂ ਸੰਪਰਕ ਕਰੀਏ",
    },
    disease: {
      badge: "ਜੈਮਿਨੀ ਵਿਜ਼ਨ ਫਸਲ ਬਿਮਾਰੀ ਵਿਗਿਆਨ",
      title: "ਏਆਈ ਫਸਲ ਬਿਮਾਰੀ ਜਾਂਚ",
      subtitle: "ਪ੍ਰਭਾਵਿਤ ਪੌਦੇ ਦੇ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ ਅਤੇ ਤੁਰੰਤ ਬਿਮਾਰੀ ਦੀ ਜਾਂਚ ਅਤੇ ਇਲਾਜ ਪ੍ਰਾਪਤ ਕਰੋ।",
      uploadBox: "ਫਸਲ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ",
      uploadBtn: "ਗੈਲਰੀ ਤੋਂ ਫੋਟੋ ਚੁਣੋ",
      dragDrop: "PNG, JPG ਜਾਂ WEBP ਫੋਟੋ ਸਵੀਕਾਰ ਹੈ",
      analyzing: "ਜੈਮਿਨੀ ਏਆਈ ਦੁਆਰਾ ਪੱਤੇ ਦੀ ਜਾਂਚ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...",
      resultsTitle: "ਬਿਮਾਰੀ ਜਾਂਚ ਰਿਪੋਰਟ",
      cropIdentified: "ਪਛਾਣੀ ਗਈ ਫਸਲ",
      diseaseFound: "ਪਾਇਆ ਗਿਆ ਰੋਗ",
      confidence: "ਸਹੀ ਹੋਣ ਦੀ ਸੰਭਾਵਨਾ",
      severity: "ਬਿਮਾਰੀ ਦੀ ਗੰਭੀਰਤਾ",
      symptoms: "ਦਿਖਾਈ ਦਿੰਦੇ ਲੱਛਣ",
      treatment: "ਸਿਫਾਰਸ਼ ਕੀਤੇ ਇਲਾਜ ਅਤੇ ਦਵਾਈਆਂ",
      prevention: "ਭਵਿੱਖ ਤੋਂ ਬਚਾਅ ਦੀ ਯੋਜਨਾ",
      disclaimer: "ਦਾਅਵਾ ਤਿਆਗ: ਕੇਵਲ ਏਆਈ ਸਹਾਇਤਾ। ਗੰਭੀਰ ਸਮੱਸਿਆ ਲਈ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ (KVK) ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
    },
    chat: {
      title: "ਐਗਰੋਗਾਰਡ ਏਆਈ ਸਹਾਇਕ",
      subtitle: "ਖੇਤੀਬਾੜੀ ਵਿਗਿਆਨੀ ਜੈਮਿਨੀ ਏਆਈ",
      placeholder: "ਫਸਲਾਂ, ਕੀੜੇ-ਮਕੌੜੇ, ਮੌਸਮ ਜਾਂ ਮੰਡੀ ਭਾਅ ਬਾਰੇ ਪੁੱਛੋ...",
      send: "ਭੇਜੋ",
      quickQuestions: "ਤੁਰੰਤ ਸਵਾਲ:",
      thinking: "ਐਗਰੋਗਾਰਡ ਏਆਈ ਸਲਾਹ ਤਿਆਰ ਕਰ ਰਿਹਾ ਹੈ...",
    },
    advisor: {
      badge: "ਖੇਤੀਬਾੜੀ ਫੈਸਲਾ ਪ੍ਰਣਾਲੀ",
      title: "ਬੁੱਧੀਮਾਨ ਫਸਲ ਸਲਾਹਕਾਰ",
      subtitle: "ਆਪਣੇ ਖੇਤਰ, ਮਿੱਟੀ ਦੀ ਕਿਸਮ ਅਤੇ ਪਾਣੀ ਦੇ ਸਾਧਨਾਂ ਅਨੁਸਾਰ ਵਧੀਆ ਫਸਲ ਦੀਆਂ ਸਿਫਾਰਸ਼ਾਂ ਪ੍ਰਾਪਤ ਕਰੋ।",
      region: "ਖੇਤਰ / ਰਾਜ",
      season: "ਬੀਜਣ ਦਾ ਮੌਸਮ",
      soilType: "ਮਿੱਟੀ ਦੀ ਕਿਸਮ",
      water: "ਸਿੰਚਾਈ ਪਾਣੀ ਦੀ ਉਪਲਬਧਤਾ",
      submit: "ਏਆਈ ਫਸਲ ਯੋਜਨਾ ਬਣਾਓ",
      recommendations: "ਸਿਫਾਰਸ਼ ਕੀਤੀਆਂ ਫਸਲਾਂ",
    },
    weather: {
      badge: "ਖੇਤੀ ਮੌਸਮ ਇੰਜਣ",
      title: "ਮੌਸਮ ਅਤੇ ਉੱਲੀ ਖਤਰਾ ਚੇਤਾਵਨੀ",
      subtitle: "ਤਾਪਮਾਨ, ਨਮੀ, ਸਪਰੇਅ ਦਾ ਸਹੀ ਸਮਾਂ ਅਤੇ ਉੱਲੀ ਰੋਗ ਦੀ ਚੇਤਾਵਨੀ ਪ੍ਰਾਪਤ ਕਰੋ।",
      useLocation: "ਮੇਰੀ ਮੌਜੂਦਾ ਲੋਕੇਸ਼ਨ ਵਰਤੋਂ",
      searchCity: "ਸ਼ਹਿਰ ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਦਰਜ ਕਰੋ...",
      humidity: "ਨਮੀ",
      windSpeed: "ਹਵਾ ਦੀ ਰਫਤਾਰ",
      rainProbability: "ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ",
      uvIndex: "ਯੂਵੀ ਇੰਡੈਕਸ",
      warnings: "ਖੇਤੀਬਾੜੀ ਖਤਰਾ ਅਤੇ ਸਪਰੇਅ ਸਲਾਹ",
      forecast: "5-ਦਿਨਾਂ ਮੌਸਮ ਭਵਿੱਖਬਾਣੀ",
      agroguardSays: "ਐਗਰੋਗਾਰਡ ਦੀ ਸਲਾਹ...",
      agroguardIntelligenceTitle: "ਮੌਸਮ-ਅਧਾਰਿਤ ਖੇਤੀਬਾੜੀ ਸਲਾਹ",
      weatherUnavailable: "ਮੌਸਮ ਸੇਵਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਲਾਈਵ ਡਾਟਾ ਪ੍ਰਾਪਤ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਿਆ।",
    },
    market: {
      badge: "ਮੰਡੀ ਭਾਅ ਜਾਣਕਾਰੀ",
      title: "ਲਾਈਵ ਮੰਡੀ ਭਾਅ ਅਤੇ ਦਰਾਂ",
      subtitle: "ਵੱਖ-ਵੱਖ ਰਾਜਾਂ ਅਤੇ ਮੰਡੀਆਂ ਵਿੱਚ ਫਸਲਾਂ ਦੇ ਘੱਟੋ-ਘੱਟ, ਵੱਧ ਤੋਂ ਵੱਧ ਅਤੇ ਮਾਡਲ ਭਾਅ ਵੇਖੋ।",
      selectCrop: "ਫਸਲ ਚੁਣੋ",
      selectState: "ਰਾਜ ਚੁਣੋ",
      mandi: "ਮੰਡੀ ਦਾ ਨਾਂ",
      minPrice: "ਘੱਟੋ-ਘੱਟ ਭਾਅ",
      maxPrice: "ਵੱਧ ਤੋਂ ਵੱਧ ਭਾਅ",
      modalPrice: "ਮਾਡਲ ਭਾਅ (₹/ਕੁਇੰਟਲ)",
      sevenDayTrend: "7-ਦਿਨਾਂ ਦਾ ਰੁਝਾਨ",
      bestNearbyMarket: "ਨੇੜਲੀ ਮੰਡੀ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਭਾਅ",
      dataUpdated: "ਅਪਡੇਟ ਦਾ ਸਮਾਂ",
      agroguardInsightTitle: "ਐਗਰੋਗਾਰਡ ਮੰਡੀ ਵਿਸ਼ਲੇਸ਼ਣ",
      sellingConsiderations: "ਫਸਲ ਵੇਚਣ ਬਾਰੇ ਵਿਚਾਰ ਅਤੇ ਸਲਾਹ",
      marketUnavailable: "ਮੰਡੀ ਸੇਵਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਲਾਈਵ ਰੇਟ ਪ੍ਰਾਪਤ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਿਆ।",
    },
    profile: {
      badge: "ਖੇਤ ਯਾਦਦਾਸ਼ਤ ਅਤੇ ਪ੍ਰੋਫਾਈਲ",
      title: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਫਾਰਮ ਮੈਮੋਰੀ",
      subtitle: "ਆਪਣੇ ਖੇਤ ਅਤੇ ਜ਼ਮੀਨ ਦਾ ਵੇਰਵਾ ਦਰਜ ਕਰੋ ਤਾਂ ਜੋ ਐਗਰੋਗਾਰਡ ਤੁਹਾਨੂੰ ਸਹੀ ਸਲਾਹ ਦੇ ਸਕੇ।",
      personalDetails: "ਕਿਸਾਨ ਦੇ ਵੇਰਵੇ",
      farmerName: "ਕਿਸਾਨ ਦਾ ਨਾਂ",
      preferredLanguage: "ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ",
      locationSection: "ਸਥਾਨ ਅਤੇ ਖੇਤਰ",
      state: "ਰਾਜ",
      district: "ਜ਼ਿਲ੍ਹਾ",
      village: "ਪਿੰਡ / ਸਥਾਨ",
      landSection: "ਜ਼ਮੀਨ ਅਤੇ ਮਿੱਟੀ",
      landArea: "ਕੁੱਲ ਜ਼ਮੀਨ (ਰਕਬਾ)",
      landUnit: "ਇਕਾਈ",
      soilType: "ਮਿੱਟੀ ਦੀ ਕਿਸਮ",
      irrigationSection: "ਸਿੰਚਾਈ ਸਾਧਨ",
      irrigationAvailable: "ਸਿੰਚਾਈ ਸੁਵਿਧਾ ਉਪਲਬਧ",
      irrigationType: "ਸਿੰਚਾਈ ਦਾ ਸਾਧਨ",
      cropSection: "ਮੌਜੂਦਾ ਫਸਲ",
      currentCrop: "ਮੌਜੂਦਾ ਫਸਲ",
      cropVariety: "ਫਸਲ ਦੀ ਕਿਸਮ",
      growthStage: "ਫਸਲ ਦਾ ਵਾਧਾ ਸਟੇਜ",
      sowingDate: "ਬੀਜਣ ਦੀ ਤਾਰੀਖ",
      financialSection: "ਬਜਟ ਅਤੇ ਤਜਰਬਾ",
      budget: "ਖੇਤੀ ਬਜਟ (₹)",
      experience: "ਖੇਤੀ ਤਜਰਬਾ (ਸਾਲ)",
      previousCrop: "ਪਿਛਲੀ ਫਸਲ",
      notes: "ਖੇਤ ਦੇ ਖਾਸ ਨੋਟਸ",
      saveBtn: "ਫਾਰਮ ਮੈਮੋਰੀ ਸੰਭਾਲੋ",
      saving: "ਸੰਭਾਲਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
      savedSuccess: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ ਸਫਲਤਾਪੂਰਵਕ ਸੰਭਾਲੀ ਗਈ!",
      farmMemorySummary: "ਸਰਗਰਮ ਫਾਰਮ ਮੈਮੋਰੀ",
    },
    economics: {
      badge: "ਜ਼ਮੀਨ ਆਕਾਰ ਅਧਾਰਿਤ ਗਣਨਾ",
      title: "💰 ਖੇਤ ਆਰਥਿਕਤਾ ਅਤੇ ਲੋੜਾਂ",
      subtitle: "ਤੁਹਾਡੇ ਖੇਤ ਦੇ ਕੁੱਲ ਰਕਬੇ ਅਨੁਸਾਰ ਬੀਜ, ਖਾਦ, ਸਿੰਚਾਈ, ਕੁੱਲ ਖਰਚਾ, ਝਾੜ ਅਤੇ ਬਚਤ ਦਾ ਪੂਰਾ ਹਿਸਾਬ।",
      landBadge: "ਜ਼ਮੀਨ ਦਾ ਰਕਬਾ",
      estimatedCost: "ਅੰਦਾਜ਼ਨ ਕੁੱਲ ਖਰਚਾ",
      expectedProduction: "ਅੰਦਾਜ਼ਨ ਫਸਲ ਝਾੜ",
      potentialRevenue: "ਸੰਭਾਵੀ ਕੁੱਲ ਆਮਦਨ",
      estimatedMargin: "ਅੰਦਾਜ਼ਨ ਖਾਲਸ ਮੁਨਾਫਾ",
      costBreakdownTitle: "ਖੇਤੀ ਖਰਚਿਆਂ ਦਾ ਵੇਰਵਾ",
      howCalculatedBtn: "ਇਹ ਹਿਸਾਬ ਕਿਵੇਂ ਕੀਤਾ ਗਿਆ?",
      howCalculatedTitle: "ਖੇਤੀਬਾੜੀ ਫਾਰਮੂਲੇ ਅਤੇ ਸਰਕਾਰੀ ਸਿਫਾਰਸ਼ਾਂ",
      simulatorTitle: "ਖੇਤ ਅਤੇ ਫਸਲ ਹਿਸਾਬ ਕੈਲਕੁਲੇਟਰ",
      customCrop: "ਫਸਲ ਚੁਣੋ",
      customArea: "ਜ਼ਮੀਨ ਦਾ ਰਕਬਾ",
      customUnit: "ਇਕਾਈ",
      customPrice: "ਮੰਡੀ ਭਾਅ (₹/ਕੁਇੰਟਲ)",
      recalculateBtn: "ਹਿਸਾਬ ਲਗਾਓ",
      verifiedDataTag: "ਪ੍ਰਮਾਣਿਤ ਡਾਟਾ",
      estimatedDataTag: "ਅੰਦਾਜ਼ਨ ਡਾਟਾ",
      unavailableDataTag: "ਅਣਉਪਲਬਧ ਡਾਟਾ",
      disclaimerTitle: "ਆਰਥਿਕ ਚੇਤਾਵਨੀ",
    },
  },

  bho: {
    nav: {
      dashboard: "ਡੈਸ਼ਬੋਰਡ",
      diseaseDetection: "ਫਸਲ ਰੋਗ ਜਾਂਚ",
      weather: "ਮੌਸਮ ਜਾਣਕਾਰੀ",
      marketPrices: "ਮੰਡੀ ਭਾਅ",
      cropAdvisor: "ਫਸਲ ਸਲਾਹਕਾਰ",
      aiAssistant: "ਏਆਈ ਸਹਾਇਕ",
      profile: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ",
      economics: "ਖੇਤ ਹਿਸਾਬ",
      farmMap: "ਖੇਤ नक्शा",
    },
    common: {
      selectLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
      search: "ਖੋਜੋ",
      loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
      error: "ਗਲਤੀ ਹੋਈ",
      locationBadge: "ਭਾਰਤ",
    },
    dashboard: {
      badge: "ਏਆਈ ਖੇਤੀ ਪਲੇਟਫਾਰਮ",
      title: "ਸਮਾਰਟ ਖੇਤੀ",
      subtitle: "ਖੇਤੀਬਾੜੀ ਮੰਚ।",
      quickActions: "ਮੁੱਖ ਸੇਵਾਵਾਂ",
      statDisease: "ਬਿਮਾਰੀ ਜਾਂਚ",
      statWeather: "ਮੌਸਮ",
      statMarket: "ਮੰਡੀ ਭਾਅ",
      statAdvisor: "ਫਸਲ ਸਲਾਹ",
      ctaAnalyze: "ਜਾਂਚੋ",
      ctaWeather: "ਵੇਖੋ",
      ctaMarket: "ਮੰਡੀ ਭਾਅ",
      ctaAdvisor: "ਸਲਾਹ ਲਓ",
      ctaChat: "ਪੁੱਛੋ",
      ctaProfile: "ਪ੍ਰੋਫਾਈਲ",
      ctaEconomics: "ਖੇਤ ਹਿਸਾਬ",
      whatShouldIDoToday: "आज हमरा का करे के चाहीं?",
      yourFarm: "रउआ खेत के हाल",
      todayPlan: "आज के खेती योजना",
      highPriority: "जरूरी काम",
      recommended: "सलाह",
      optional: "सामान्य",
      next3Days: "आवे वाला 3 दिन",
      next7Days: "आवे वाला 7 दिन",
      watchFor: "ध्यान दीं",
      avoid: "का ना करीं",
      expertHelp: "विशेषज्ञ सलाह",
    },
    disease: {
      badge: "ਏਆਈ ਜਾਂਚ",
      title: "ਫਸਲ ਬਿਮਾਰੀ ਜਾਂਚ",
      subtitle: "ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ।",
      uploadBox: "ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ",
      uploadBtn: "ਚੁਣੋ",
      dragDrop: "ਫੋਟੋ ਫਾਰਮੈਟ",
      analyzing: "ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ...",
      resultsTitle: "ਰਿਪੋਰਟ",
      cropIdentified: "ਫਸਲ",
      diseaseFound: "ਬਿਮਾਰੀ",
      confidence: "ਸਟੀਕਤਾ",
      severity: "ਗੰਭੀਰਤਾ",
      symptoms: "ਲੱਛਣ",
      treatment: "ਇਲਾਜ",
      prevention: "ਬਚਾਅ",
      disclaimer: "ਸਲਾਹ",
    },
    chat: {
      title: "ਏਆਈ ਸਹਾਇਕ",
      subtitle: "ਖੇਤੀ ਸਹਾਇਕ",
      placeholder: "ਸਵਾਲ ਪੁੱਛੋ...",
      send: "ਭੇਜੋ",
      quickQuestions: "ਸਵਾਲ:",
      thinking: "ਸੋਚ ਰਿਹਾ ਹੈ...",
    },
    advisor: {
      badge: "ਸਲਾਹ",
      title: "ਫਸਲ ਸਲਾਹਕਾਰ",
      subtitle: "ਵਧੀਆ ਫਸਲ ਚੁਣੋ।",
      region: "ਖੇਤਰ",
      season: "ਮੌਸਮ",
      soilType: "ਮਿੱਟੀ",
      water: "ਪਾਣੀ",
      submit: "ਯੋਜਨਾ ਬਣਾਓ",
      recommendations: "ਸਿਫਾਰਸ਼ਾਂ",
    },
    weather: {
      badge: "ਮੌਸਮ",
      title: "ਮੌਸਮ ਅਲਰਟ",
      subtitle: "ਮੌਸਮ ਵੇਖੋ।",
      useLocation: "ਲੋਕੇਸ਼ਨ",
      searchCity: "ਸ਼ਹਿਰ",
      humidity: "ਨਮੀ",
      windSpeed: "ਹਵਾ",
      rainProbability: "ਮੀਂਹ",
      uvIndex: "ਯੂਵੀ",
      warnings: "ਚੇਤਾਵਨੀ",
      forecast: "ਭਵਿੱਖਬਾਣੀ",
      agroguardSays: "एग्रोगार्ड के सलाह...",
      agroguardIntelligenceTitle: "मौसम-आधारित खेती सलाह",
      weatherUnavailable: "मौसम सेवा उपलब्ध नइखे। लाइव डेटा ना मिल सकल।",
    },
    market: {
      badge: "ਮੰਡੀ",
      title: "ਮੰਡੀ ਭਾਅ",
      subtitle: "ਭਾਅ ਵੇਖੋ।",
      selectCrop: "ਫਸਲ",
      selectState: "ਰਾਜ",
      mandi: "ਮੰਡੀ",
      minPrice: "ਘੱਟ",
      maxPrice: "ਵੱਧ",
      modalPrice: "ਮਾਡਲ ਭਾਅ",
      sevenDayTrend: "7-दिन के रुझान",
      bestNearbyMarket: "लगे के मंडी के बढ़िया भाव",
      dataUpdated: "अंतिम अपडेट",
      agroguardInsightTitle: "एग्रोगार्ड मंडी सलाह",
      sellingConsiderations: "फसल बेचे खातिर सलाह",
      marketUnavailable: "मंडी सेवा उपलब्ध नइखे।",
    },
    profile: {
      badge: "ਪ੍ਰੋਫਾਈਲ",
      title: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ",
      subtitle: "ਵੇਰਵਾ ਭਰੋ।",
      personalDetails: "ਵੇਰਵਾ",
      farmerName: "ਨਾਂ",
      preferredLanguage: "ਭਾਸ਼ਾ",
      locationSection: "ਸਥਾਨ",
      state: "ਰਾਜ",
      district: "ਜ਼ਿਲ੍ਹਾ",
      village: "ਪਿੰਡ",
      landSection: "ਜ਼ਮੀਨ",
      landArea: "ਰਕਬਾ",
      landUnit: "ਇਕਾਈ",
      soilType: "ਮਿੱਟੀ",
      irrigationSection: "ਸਿੰਚਾਈ",
      irrigationAvailable: "ਸੁਵਿਧਾ",
      irrigationType: "ਸਾਧਨ",
      cropSection: "ਫਸਲ",
      currentCrop: "ਮੌਜੂਦਾ ਫਸਲ",
      cropVariety: "ਕਿਸਮ",
      growthStage: "ਸਟੇਜ",
      sowingDate: "ਤਾਰੀਖ",
      financialSection: "ਬਜਟ",
      budget: "ਬਜਟ",
      experience: "ਤਜਰਬਾ",
      previousCrop: "ਪਿਛਲੀ ਫਸਲ",
      notes: "ਨੋਟਸ",
      saveBtn: "ਸੰਭਾਲੋ",
      saving: "ਸੰਭਾਲਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
      savedSuccess: "ਸੰਭਾਲਿਆ ਗਿਆ!",
      farmMemorySummary: "ਮੈਮੋਰੀ",
    },
    economics: {
      badge: "ਖੇਤ ਹਿਸਾਬ",
      title: "💰 ਖੇਤ ਹਿਸਾਬ-ਕਿਤਾਬ",
      subtitle: "ਜ਼ਮੀਨ ਅਨੁਸਾਰ ਖਰਚਾ ਅਤੇ ਆਮਦਨ।",
      landBadge: "ਜ਼ਮੀਨ",
      estimatedCost: "ਖਰਚਾ",
      expectedProduction: "ਪੈਦਾਵਾਰ",
      potentialRevenue: "ਆਮਦਨ",
      estimatedMargin: "ਮੁਨਾਫਾ",
      costBreakdownTitle: "ਖਰਚਿਆਂ ਦਾ ਵੇਰਵਾ",
      howCalculatedBtn: "ਹਿਸਾਬ ਵੇਖੋ",
      howCalculatedTitle: "ਫਾਰਮੂਲਾ",
      simulatorTitle: "ਕੈਲਕੁਲੇਟਰ",
      customCrop: "ਫਸਲ",
      customArea: "ਰਕਬਾ",
      customUnit: "ਇਕਾਈ",
      customPrice: "ਭਾਅ",
      recalculateBtn: "ਹਿਸਾਬ ਕਰੋ",
      verifiedDataTag: "ਪ੍ਰਮਾਣਿਤ",
      estimatedDataTag: "ਅੰਦਾਜ਼ਨ",
      unavailableDataTag: "ਅਣਉਪਲਬਧ",
      disclaimerTitle: "ਚੇਤਾਵਨੀ",
    },
  },

  hr: {
    nav: {
      dashboard: "ਡੈਸ਼ਬੋਰਡ",
      diseaseDetection: "ਫਸਲ ਬਿਮਾਰੀ ਜਾਂਚ",
      weather: "ਮੌਸਮ ਅਲਰਟ",
      marketPrices: "ਮੰਡੀ ਭਾਅ",
      cropAdvisor: "ਫਸਲ ਸਲਾਹਕਾਰ",
      aiAssistant: "ਏਆਈ ਸਹਾਇਕ",
      profile: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ",
      economics: "ਖੇਤ ਹਿਸਾਬ",
      farmMap: "ਖੇਤ કા नक्शा",
    },
    common: {
      selectLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
      search: "ਖੋਜੋ",
      loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
      error: "ਗਲਤੀ ਹੋਈ",
      locationBadge: "ਭਾਰਤ",
    },
    dashboard: {
      badge: "ਏਆਈ ਖੇਤੀ ਪਲੇਟਫਾਰਮ",
      title: "ਸਮਾਰਟ ਖੇਤੀ",
      subtitle: "ਖੇਤੀਬਾੜੀ ਮੰਚ।",
      quickActions: "ਮੁੱਖ ਸੇਵਾਵਾਂ",
      statDisease: "ਬਿਮਾਰੀ ਜਾਂਚ",
      statWeather: "ਮੌਸਮ",
      statMarket: "ਮੰਡੀ ਭਾਅ",
      statAdvisor: "ਫਸਲ ਸਲਾਹ",
      ctaAnalyze: "ਜਾਂਚੋ",
      ctaWeather: "ਵੇਖੋ",
      ctaMarket: "ਮੰਡੀ ਭਾਅ",
      ctaAdvisor: "ਸਲਾਹ ਲਓ",
      ctaChat: "ਪੁੱਛੋ",
      ctaProfile: "ਪ੍ਰੋਫਾਈਲ",
      ctaEconomics: "ਖੇਤ ਹਿਸਾਬ",
      whatShouldIDoToday: "आज मन्नै के कर्णा चाहिए?",
      yourFarm: "थारे खेत का हाल",
      todayPlan: "आज का खेती का काम",
      highPriority: "घणा जरूरी काम",
      recommended: "सलाह",
      optional: "आस-पास का काम",
      next3Days: "अगले 3 दिन",
      next7Days: "अगले 7 दिन",
      watchFor: "ध्यान राक्खौ",
      avoid: "के ना कर्णा",
      expertHelp: "एक्सपर्ट सलाह",
    },
    disease: {
      badge: "ਏਆਈ ਜਾਂਚ",
      title: "ਫਸਲ ਬਿਮਾਰੀ ਜਾਂਚ",
      subtitle: "ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ।",
      uploadBox: "ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ",
      uploadBtn: "ਚੁਣੋ",
      dragDrop: "ਫੋਟੋ ਫਾਰਮੈਟ",
      analyzing: "ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ...",
      resultsTitle: "ਰਿਪੋਰਟ",
      cropIdentified: "ਫਸਲ",
      diseaseFound: "ਬਿਮਾਰੀ",
      confidence: "ਸਟੀਕਤਾ",
      severity: "ਗੰਭੀਰਤਾ",
      symptoms: "ਲੱਛਣ",
      treatment: "ਇਲਾਜ",
      prevention: "ਬਚਾਅ",
      disclaimer: "ਸਲਾਹ",
    },
    chat: {
      title: "ਏਆਈ ਸਹਾਇਕ",
      subtitle: "ਖੇਤੀ ਸਹਾਇਕ",
      placeholder: "ਸਵਾਲ ਪੁੱਛੋ...",
      send: "ਭੇਜੋ",
      quickQuestions: "ਸਵਾਲ:",
      thinking: "ਸੋਚ ਰਿਹਾ ਹੈ...",
    },
    advisor: {
      badge: "ਸਲਾਹ",
      title: "ਫਸਲ ਸਲਾਹਕਾਰ",
      subtitle: "ਵਧੀਆ ਫਸਲ ਚੁਣੋ।",
      region: "ਖੇਤਰ",
      season: "ਮੌਸਮ",
      soilType: "ਮਿੱਟੀ",
      water: "ਪਾਣੀ",
      submit: "ਯੋਜਨਾ ਬਣਾਓ",
      recommendations: "ਸਿਫਾਰਸ਼ਾਂ",
    },
    weather: {
      badge: "ਮੌਸਮ",
      title: "ਮੌਸਮ ਅਲਰਟ",
      subtitle: "ਮੌਸਮ ਵੇਖੋ।",
      useLocation: "ਲੋਕੇਸ਼ਨ",
      searchCity: "ਸ਼ਹਿਰ",
      humidity: "ਨਮੀ",
      windSpeed: "ਹਵਾ",
      rainProbability: "ਮੀਂਹ",
      uvIndex: "ਯੂਵੀ",
      warnings: "ਚੇਤਾਵਨੀ",
      forecast: "ਭਵਿੱਖਬਾਣੀ",
      agroguardSays: "एग्रोगार्ड की सलाह...",
      agroguardIntelligenceTitle: "मौसम-आधारित खेती सलाह",
      weatherUnavailable: "मौसम सेवा उपलब्ध कोन्या। लाइव डेटा कोन्या मिल्या।",
    },
    market: {
      badge: "ਮੰਡੀ",
      title: "ਮੰਡੀ ਭਾਅ",
      subtitle: "ਭਾਅ ਵੇਖੋ।",
      selectCrop: "ਫਸਲ",
      selectState: "ਰਾਜ",
      mandi: "ਮੰਡੀ",
      minPrice: "ਘੱਟ",
      maxPrice: "ਵੱਧ",
      modalPrice: "ਮਾਡਲ ਭਾਅ",
      sevenDayTrend: "7-दिन का रुझान",
      bestNearbyMarket: "दोरे की मंडी का बढ़िया भाव",
      dataUpdated: "अंतिम अपडेट",
      agroguardInsightTitle: "एग्रोगार्ड मंडी सलाह",
      sellingConsiderations: "फसल बेच्चण की सलाह",
      marketUnavailable: "मंडी सेवा उपलब्ध कोन्या।",
    },
    profile: {
      badge: "ਪ੍ਰੋਫਾਈਲ",
      title: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ",
      subtitle: "ਵੇਰਵਾ ਭਰੋ।",
      personalDetails: "ਵੇਰਵਾ",
      farmerName: "ਨਾਂ",
      preferredLanguage: "ਭਾਸ਼ਾ",
      locationSection: "ਸਥਾਨ",
      state: "ਰਾਜ",
      district: "ਜ਼ਿਲ੍ਹਾ",
      village: "ਪਿੰਡ",
      landSection: "ਜ਼ਮੀਨ",
      landArea: "ਰਕਬਾ",
      landUnit: "ਇਕਾਈ",
      soilType: "ਮਿੱਟੀ",
      irrigationSection: "ਸਿੰਚਾਈ",
      irrigationAvailable: "ਸੁਵਿਧਾ",
      irrigationType: "ਸਾਧਨ",
      cropSection: "ਫਸਲ",
      currentCrop: "ਮੌਜੂਦਾ ਫਸਲ",
      cropVariety: "ਕਿਸਮ",
      growthStage: "ਸਟੇਜ",
      sowingDate: "ਤਾਰੀਖ",
      financialSection: "ਬਜਟ",
      budget: "ਬਜਟ",
      experience: "ਤਜਰਬਾ",
      previousCrop: "ਪਿਛਲੀ ਫਸਲ",
      notes: "ਨੋਟਸ",
      saveBtn: "ਸੰਭਾਲੋ",
      saving: "ਸੰਭਾਲਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
      savedSuccess: "ਸੰਭਾਲਿਆ ਗਿਆ!",
      farmMemorySummary: "ਮੈਮੋਰੀ",
    },
    economics: {
      badge: "ਖੇਤ ਹਿਸਾਬ",
      title: "💰 ਖੇਤ ਹਿਸਾਬ-ਕਿਤਾਬ",
      subtitle: "ਜ਼ਮੀਨ ਅਨੁਸਾਰ ਖਰਚਾ ਅਤੇ ਆਮਦਨ।",
      landBadge: "ਜ਼ਮੀਨ",
      estimatedCost: "ਖਰਚਾ",
      expectedProduction: "ਪੈਦਾਵਾਰ",
      potentialRevenue: "ਆਮਦਨ",
      estimatedMargin: "ਮੁਨਾਫਾ",
      costBreakdownTitle: "ਖਰਚਿਆਂ ਦਾ ਵੇਰਵਾ",
      howCalculatedBtn: "ਹਿਸਾਬ ਵੇਖੋ",
      howCalculatedTitle: "ਫਾਰਮੂਲਾ",
      simulatorTitle: "ਕੈਲਕੁਲੇਟਰ",
      customCrop: "ਫਸਲ",
      customArea: "ਰਕਬਾ",
      customUnit: "ਇਕਾਈ",
      customPrice: "ਭਾਅ",
      recalculateBtn: "ਹਿਸਾਬ ਕਰੋ",
      verifiedDataTag: "ਪ੍ਰਮਾਣਿਤ",
      estimatedDataTag: "ਅੰਦਾਜ਼ਨ",
      unavailableDataTag: "ਅਣਉਪਲਬਧ",
      disclaimerTitle: "ਚੇਤਾਵਨੀ",
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  getBackendLanguageName: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("agroguard_language") as Language;
    if (saved && ["en", "hi", "pa", "bho", "hr"].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("agroguard_language", lang);
  };

  const getBackendLanguageName = (): string => {
    switch (language) {
      case "hi":
        return "Hindi";
      case "pa":
        return "Punjabi";
      case "bho":
        return "Bhojpuri";
      case "hr":
        return "Haryanvi";
      default:
        return "English";
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language] || translations["en"],
        getBackendLanguageName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
