export type CategoryType = "income" | "expense";

export type CategoryKey =
  | "foodAndDrinks"
  | "shopping"
  | "housing"
  | "transportation"
  | "vehicle"
  | "lifeEntertainment"
  | "communicationPc"
  | "financialExpenses"
  | "investments"
  | "others"
  | "income";

export type CategoryDefinition = {
  id: CategoryKey;
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
};

export type SubcategoryDefinition = {
  id: string;
  parentId: CategoryKey;
  name: string;
  icon: string;
};

export const CATEGORY_MAP: Record<CategoryKey, CategoryDefinition> = {
  foodAndDrinks: {
    id: "foodAndDrinks",
    name: "Food & Drinks",
    color: "#F97316",
    icon: "silverware-fork-knife",
    type: "expense",
  },
  shopping: {
    id: "shopping",
    name: "Shopping",
    color: "#A855F7",
    icon: "shopping",
    type: "expense",
  },
  housing: {
    id: "housing",
    name: "Housing",
    color: "#EF4444",
    icon: "home-variant-outline",
    type: "expense",
  },
  transportation: {
    id: "transportation",
    name: "Transportation",
    color: "#0EA5E9",
    icon: "bus",
    type: "expense",
  },
  vehicle: {
    id: "vehicle",
    name: "Vehicle",
    color: "#22C55E",
    icon: "car",
    type: "expense",
  },
  lifeEntertainment: {
    id: "lifeEntertainment",
    name: "Life & Entertainment",
    color: "#EC4899",
    icon: "party-popper",
    type: "expense",
  },
  communicationPc: {
    id: "communicationPc",
    name: "Communication, PC",
    color: "#6366F1",
    icon: "cellphone",
    type: "expense",
  },
  financialExpenses: {
    id: "financialExpenses",
    name: "Financial Expenses",
    color: "#F59E0B",
    icon: "bank-outline",
    type: "expense",
  },
  investments: {
    id: "investments",
    name: "Investments",
    color: "#10B981",
    icon: "chart-line",
    type: "expense",
  },
  others: {
    id: "others",
    name: "Others",
    color: "#9CA3AF",
    icon: "dots-horizontal-circle",
    type: "expense",
  },
  income: {
    id: "income",
    name: "Income",
    color: "#2563EB",
    icon: "wallet-plus",
    type: "income",
  },
};

export const SUBCATEGORY_SETS: Record<CategoryKey, SubcategoryDefinition[]> = {
  foodAndDrinks: [
    { id: "foodAndDrinks:bar-cafe", parentId: "foodAndDrinks", name: "Bar, Cafe", icon: "coffee-outline" },
    { id: "foodAndDrinks:groceries", parentId: "foodAndDrinks", name: "Groceries", icon: "cart-outline" },
    { id: "foodAndDrinks:restaurant-fast-food", parentId: "foodAndDrinks", name: "Restaurant, Fast-food", icon: "silverware-fork-knife" },
  ],
  shopping: [
    { id: "shopping:clothes-shoes", parentId: "shopping", name: "Clothes & shoes", icon: "tshirt-crew-outline" },
    { id: "shopping:drug-store-chemist", parentId: "shopping", name: "Drug-store, chemist", icon: "pill" },
    { id: "shopping:electronics-accessories", parentId: "shopping", name: "Electronics, accessories", icon: "cellphone" },
    { id: "shopping:free-time", parentId: "shopping", name: "Free-time", icon: "puzzle-outline" },
    { id: "shopping:gifts-joy", parentId: "shopping", name: "Gifts, joy", icon: "gift-outline" },
    { id: "shopping:health-beauty", parentId: "shopping", name: "Health and beauty", icon: "flower-outline" },
    { id: "shopping:home-green", parentId: "shopping", name: "Home, green", icon: "leaf" },
    { id: "shopping:jewels-accessories", parentId: "shopping", name: "Jewels, accessories", icon: "diamond-stone" },
    { id: "shopping:kids", parentId: "shopping", name: "Kids", icon: "baby-face-outline" },
    { id: "shopping:pets-animals", parentId: "shopping", name: "Pets, animals", icon: "paw" },
    { id: "shopping:stationary-tools", parentId: "shopping", name: "Stationary, tools", icon: "pencil-ruler" },
  ],
  housing: [
    { id: "housing:energy-utilities", parentId: "housing", name: "Energy, utilities", icon: "flash-outline" },
    { id: "housing:maintenance-repairs", parentId: "housing", name: "Maintenance, repairs", icon: "hammer-wrench" },
    { id: "housing:mortgage", parentId: "housing", name: "Mortgage", icon: "office-building-outline" },
    { id: "housing:property-insurance", parentId: "housing", name: "Property insurance", icon: "shield-home-outline" },
    { id: "housing:rent", parentId: "housing", name: "Rent", icon: "home-city-outline" },
    { id: "housing:services", parentId: "housing", name: "Services", icon: "toolbox-outline" },
  ],
  transportation: [
    { id: "transportation:business-trips", parentId: "transportation", name: "Business trips", icon: "briefcase-outline" },
    { id: "transportation:long-distance", parentId: "transportation", name: "Long distance", icon: "airplane" },
    { id: "transportation:public-transport", parentId: "transportation", name: "Public transport", icon: "bus" },
    { id: "transportation:taxi", parentId: "transportation", name: "Taxi", icon: "taxi" },
  ],
  vehicle: [
    { id: "vehicle:fuel", parentId: "vehicle", name: "Fuel", icon: "gas-station-outline" },
    { id: "vehicle:leasing", parentId: "vehicle", name: "Leasing", icon: "car-key" },
    { id: "vehicle:parking", parentId: "vehicle", name: "Parking", icon: "parking" },
    { id: "vehicle:rentals", parentId: "vehicle", name: "Rentals", icon: "car-arrow-right" },
    { id: "vehicle:vehicle-insurance", parentId: "vehicle", name: "Vehicle insurance", icon: "shield-car" },
    { id: "vehicle:vehicle-maintenance", parentId: "vehicle", name: "Vehicle maintenance", icon: "car-wrench" },
  ],
  lifeEntertainment: [
    { id: "lifeEntertainment:active-sport-fitness", parentId: "lifeEntertainment", name: "Active sport, fitness", icon: "dumbbell" },
    { id: "lifeEntertainment:alcohol-tobacco", parentId: "lifeEntertainment", name: "Alcohol, tobacco", icon: "glass-cocktail" },
    { id: "lifeEntertainment:books-audio-subscriptions", parentId: "lifeEntertainment", name: "Books, audio, subscriptions", icon: "book-open-page-variant" },
    { id: "lifeEntertainment:charity-gifts", parentId: "lifeEntertainment", name: "Charity, gifts", icon: "hand-heart-outline" },
    { id: "lifeEntertainment:culture-sport-events", parentId: "lifeEntertainment", name: "Culture, sport events", icon: "ticket-confirmation-outline" },
    { id: "lifeEntertainment:education-development", parentId: "lifeEntertainment", name: "Education, development", icon: "school-outline" },
    { id: "lifeEntertainment:health-care-doctor", parentId: "lifeEntertainment", name: "Health care, doctor", icon: "stethoscope" },
    { id: "lifeEntertainment:hobbies", parentId: "lifeEntertainment", name: "Hobbies", icon: "palette-outline" },
    { id: "lifeEntertainment:holiday-trips-hotels", parentId: "lifeEntertainment", name: "Holiday, trips, hotels", icon: "beach" },
    { id: "lifeEntertainment:life-events", parentId: "lifeEntertainment", name: "Life events", icon: "party-popper" },
    { id: "lifeEntertainment:lottery-gambling", parentId: "lifeEntertainment", name: "Lottery, gambling", icon: "dice-5" },
    { id: "lifeEntertainment:tv-streaming", parentId: "lifeEntertainment", name: "TV, Streaming", icon: "television-play" },
    { id: "lifeEntertainment:wellness-beauty", parentId: "lifeEntertainment", name: "Wellness, beauty", icon: "flower-lotus" },
  ],
  communicationPc: [
    { id: "communicationPc:internet", parentId: "communicationPc", name: "Internet", icon: "wifi" },
    { id: "communicationPc:phone-cellphone", parentId: "communicationPc", name: "Phone, cellphone", icon: "cellphone" },
    { id: "communicationPc:postal-services", parentId: "communicationPc", name: "Postal services", icon: "email-outline" },
    { id: "communicationPc:software-apps-games", parentId: "communicationPc", name: "Software, apps, games", icon: "controller-classic-outline" },
  ],
  financialExpenses: [
    { id: "financialExpenses:advisory", parentId: "financialExpenses", name: "Advisory", icon: "account-tie-outline" },
    { id: "financialExpenses:charges-fees", parentId: "financialExpenses", name: "Charges, Fees", icon: "cash-multiple" },
    { id: "financialExpenses:child-support", parentId: "financialExpenses", name: "Child Support", icon: "human-child" },
    { id: "financialExpenses:fines", parentId: "financialExpenses", name: "Fines", icon: "gavel" },
    { id: "financialExpenses:insurances", parentId: "financialExpenses", name: "Insurances", icon: "shield-outline" },
    { id: "financialExpenses:loan-interest", parentId: "financialExpenses", name: "Loan, Interest", icon: "cash-plus" },
    { id: "financialExpenses:taxes", parentId: "financialExpenses", name: "Taxes", icon: "file-document-outline" },
  ],
  investments: [
    { id: "investments:collections", parentId: "investments", name: "Collections", icon: "cube-outline" },
    { id: "investments:financial-investments", parentId: "investments", name: "Financial investments", icon: "chart-line" },
    { id: "investments:realty", parentId: "investments", name: "Realty", icon: "home-modern" },
    { id: "investments:savings", parentId: "investments", name: "Savings", icon: "piggy-bank" },
    { id: "investments:vehicle-chattels", parentId: "investments", name: "Vehicle, chattels", icon: "garage" },
  ],
  others: [
    { id: "others:missing", parentId: "others", name: "Missing", icon: "dots-horizontal-circle-outline" },
  ],
  income: [
    { id: "income:checks-coupons", parentId: "income", name: "Checks, coupons", icon: "ticket-percent" },
    { id: "income:child-support", parentId: "income", name: "Child Support", icon: "human-child" },
    { id: "income:dues-grants", parentId: "income", name: "Dues & grants", icon: "hand-coin-outline" },
    { id: "income:gifts", parentId: "income", name: "Gifts", icon: "gift-outline" },
    { id: "income:interests-dividends", parentId: "income", name: "Interests, dividends", icon: "chart-areaspline" },
    { id: "income:lending-renting", parentId: "income", name: "Lending, renting", icon: "handshake" },
    { id: "income:lottery-gambling", parentId: "income", name: "Lottery, Gambling", icon: "dice-5" },
    { id: "income:refunds", parentId: "income", name: "Refunds (tax, purchase)", icon: "cash-refund" },
    { id: "income:rental-income", parentId: "income", name: "Rental Income", icon: "home-city-outline" },
    { id: "income:sale", parentId: "income", name: "Sale", icon: "tag-outline" },
    { id: "income:wage-invoices", parentId: "income", name: "Wage, invoices", icon: "briefcase-outline" },
  ],
};

export const DEFAULT_CATEGORY_ID: CategoryKey = "others";
export const DEFAULT_SUBCATEGORY_ID = "others:missing";

export const CATEGORY_REFERENCE_TEXT = buildCategoryReference();

function buildCategoryReference(): string {
  const groups = Object.values(CATEGORY_MAP)
    .map((category) => {
      const subcategories = SUBCATEGORY_SETS[category.id]
        .map((subcategory) => `    - ${subcategory.id} -> ${subcategory.name}`)
        .join("\n") || "    - none";
      return `- ${category.id} -> ${category.name}\n${subcategories}`;
    })
    .join("\n");

  return `Valid categories and subcategories (use the exact ids):\n${groups}\nIf nothing fits, use ${DEFAULT_CATEGORY_ID} with subcategory ${DEFAULT_SUBCATEGORY_ID}.`;
}
