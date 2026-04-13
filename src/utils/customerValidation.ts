import type { FormRules } from "element-plus";
import type { CustomerFormData } from "@/api/customer";

const CUSTOMER_FIELD_LIMITS = {
  nameMin: 2,
  nameMax: 100,
  emailMax: 100,
  phoneMax: 30,
  faxMax: 30,
  countryMax: 60,
  provinceMax: 60,
  cityMax: 60,
  districtMax: 60,
  streetMax: 200,
  industryMax: 100,
  wechatMax: 50,
  linkedinMax: 200,
  twitterMax: 200,
  descriptionMax: 1000,
  remarkMax: 2000,
  tagMaxCount: 10,
  tagMaxLength: 30,
} as const;

const CUSTOMER_PATTERNS = {
  phone: /^(\+?\d{1,4}[- ]?)?\(?\d{1,4}?\)?[- ]?\d{1,4}[- ]?\d{1,9}$/,
  mobile: /^1[3-9]\d{9}$/,
  postalCode: /^\d{6}$/,
  qq: /^[1-9]\d{4,10}$/,
};

const isEmptyValue = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "");

const isValidHttpUrlLike = (value: string) => {
  try {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }

    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname.length > 0;
  } catch {
    return false;
  }
};

const normalizeOptionalString = (value: string | undefined, { lowercase = false } = {}) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return lowercase ? trimmed.toLowerCase() : trimmed;
};

const normalizeTags = (tags: string[] | undefined) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) {
      continue;
    }

    const lookupKey = trimmed.toLowerCase();
    if (!seen.has(lookupKey)) {
      seen.add(lookupKey);
      normalized.push(trimmed);
    }
  }

  return normalized;
};

const buildOptionalLengthValidator =
  (label: string, maxLength: number) =>
  (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
    if (isEmptyValue(value)) {
      callback();
      return;
    }

    if (typeof value !== "string") {
      callback(new Error(`${label} must be a string.`));
      return;
    }

    if (value.trim().length > maxLength) {
      callback(new Error(`${label} cannot exceed ${maxLength} characters.`));
      return;
    }

    callback();
  };

const buildOptionalPatternValidator =
  (label: string, pattern: RegExp, message: string, maxLength?: number) =>
  (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
    if (isEmptyValue(value)) {
      callback();
      return;
    }

    if (typeof value !== "string") {
      callback(new Error(`${label} must be a string.`));
      return;
    }

    const trimmed = value.trim();
    if (maxLength && trimmed.length > maxLength) {
      callback(new Error(`${label} cannot exceed ${maxLength} characters.`));
      return;
    }

    if (!pattern.test(trimmed)) {
      callback(new Error(message));
      return;
    }

    callback();
  };

const buildOptionalUrlValidator =
  (label: string, maxLength: number) =>
  (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
    if (isEmptyValue(value)) {
      callback();
      return;
    }

    if (typeof value !== "string") {
      callback(new Error(`${label} must be a string.`));
      return;
    }

    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
      callback(new Error(`${label} cannot exceed ${maxLength} characters.`));
      return;
    }

    if (!isValidHttpUrlLike(trimmed)) {
      callback(new Error(`${label} must be a valid URL.`));
      return;
    }

    callback();
  };

const validateNonNegativeNumber = (label: string, integer = false) => (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
  if (value === undefined || value === null || value === "") {
    callback();
    return;
  }

  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    callback(new Error(`${label} must be a valid number.`));
    return;
  }

  if (value < 0) {
    callback(new Error(`${label} cannot be negative.`));
    return;
  }

  if (integer && !Number.isInteger(value)) {
    callback(new Error(`${label} must be a whole number.`));
    return;
  }

  callback();
};

const validateTags = (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
  if (value === undefined || value === null) {
    callback();
    return;
  }

  if (!Array.isArray(value)) {
    callback(new Error("Tags must be an array."));
    return;
  }

  const normalized = normalizeTags(value.map((item) => String(item)));
  if (normalized.length > CUSTOMER_FIELD_LIMITS.tagMaxCount) {
    callback(new Error(`You can add up to ${CUSTOMER_FIELD_LIMITS.tagMaxCount} tags.`));
    return;
  }

  const hasLongTag = normalized.some((tag) => tag.length > CUSTOMER_FIELD_LIMITS.tagMaxLength);
  if (hasLongTag) {
    callback(new Error(`Each tag cannot exceed ${CUSTOMER_FIELD_LIMITS.tagMaxLength} characters.`));
    return;
  }

  callback();
};

export const createDefaultCustomerFormData = (): CustomerFormData => ({
  name: "",
  type: "individual",
  status: "potential",
  level: "C",
  source: "internet",
  currency: "CNY",
  country: "China",
  email: "",
  phone: "",
  mobile: "",
  fax: "",
  website: "",
  province: "",
  city: "",
  district: "",
  street: "",
  postalCode: "",
  industry: "",
  annualRevenue: undefined,
  employeeCount: undefined,
  wechat: "",
  qq: "",
  linkedin: "",
  twitter: "",
  description: "",
  remark: "",
  tags: [],
});

export const sanitizeCustomerFormData = (formData: CustomerFormData): CustomerFormData => ({
  ...formData,
  name: formData.name.trim(),
  email: normalizeOptionalString(formData.email, { lowercase: true }),
  phone: normalizeOptionalString(formData.phone),
  mobile: normalizeOptionalString(formData.mobile),
  fax: normalizeOptionalString(formData.fax),
  website: normalizeOptionalString(formData.website, { lowercase: true }),
  country: normalizeOptionalString(formData.country),
  province: normalizeOptionalString(formData.province),
  city: normalizeOptionalString(formData.city),
  district: normalizeOptionalString(formData.district),
  street: normalizeOptionalString(formData.street),
  postalCode: normalizeOptionalString(formData.postalCode),
  industry: normalizeOptionalString(formData.industry),
  wechat: normalizeOptionalString(formData.wechat),
  qq: normalizeOptionalString(formData.qq),
  linkedin: normalizeOptionalString(formData.linkedin, { lowercase: true }),
  twitter: normalizeOptionalString(formData.twitter, { lowercase: true }),
  description: normalizeOptionalString(formData.description),
  remark: normalizeOptionalString(formData.remark),
  tags: normalizeTags(formData.tags),
  annualRevenue:
    typeof formData.annualRevenue === "number" && Number.isFinite(formData.annualRevenue)
      ? formData.annualRevenue
      : undefined,
  employeeCount:
    typeof formData.employeeCount === "number" && Number.isFinite(formData.employeeCount)
      ? formData.employeeCount
      : undefined,
});

export const createCustomerFormRules = (): FormRules<CustomerFormData> => ({
  name: [
    { required: true, message: "Please enter a customer name.", trigger: "blur" },
    {
      min: CUSTOMER_FIELD_LIMITS.nameMin,
      max: CUSTOMER_FIELD_LIMITS.nameMax,
      message: `Customer name must be between ${CUSTOMER_FIELD_LIMITS.nameMin} and ${CUSTOMER_FIELD_LIMITS.nameMax} characters.`,
      trigger: "blur",
    },
  ],
  type: [{ required: true, message: "Please select a customer type.", trigger: "change" }],
  status: [{ required: true, message: "Please select a customer status.", trigger: "change" }],
  level: [{ required: true, message: "Please select a customer tier.", trigger: "change" }],
  email: [
    {
      validator: buildOptionalPatternValidator(
        "Email",
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address.",
        CUSTOMER_FIELD_LIMITS.emailMax,
      ),
      trigger: "blur",
    },
  ],
  phone: [
    {
      validator: buildOptionalPatternValidator(
        "Phone number",
        CUSTOMER_PATTERNS.phone,
        "Please enter a valid phone number.",
        CUSTOMER_FIELD_LIMITS.phoneMax,
      ),
      trigger: "blur",
    },
  ],
  mobile: [
    {
      validator: buildOptionalPatternValidator(
        "Mobile number",
        CUSTOMER_PATTERNS.mobile,
        "Please enter a valid mobile number.",
        CUSTOMER_FIELD_LIMITS.phoneMax,
      ),
      trigger: "blur",
    },
  ],
  fax: [
    {
      validator: buildOptionalPatternValidator(
        "Fax number",
        CUSTOMER_PATTERNS.phone,
        "Please enter a valid fax number.",
        CUSTOMER_FIELD_LIMITS.faxMax,
      ),
      trigger: "blur",
    },
  ],
  website: [{ validator: buildOptionalUrlValidator("Website", CUSTOMER_FIELD_LIMITS.twitterMax), trigger: "blur" }],
  country: [{ validator: buildOptionalLengthValidator("Country", CUSTOMER_FIELD_LIMITS.countryMax), trigger: "blur" }],
  province: [{ validator: buildOptionalLengthValidator("Province", CUSTOMER_FIELD_LIMITS.provinceMax), trigger: "blur" }],
  city: [{ validator: buildOptionalLengthValidator("City", CUSTOMER_FIELD_LIMITS.cityMax), trigger: "blur" }],
  district: [{ validator: buildOptionalLengthValidator("District", CUSTOMER_FIELD_LIMITS.districtMax), trigger: "blur" }],
  street: [{ validator: buildOptionalLengthValidator("Street address", CUSTOMER_FIELD_LIMITS.streetMax), trigger: "blur" }],
  postalCode: [
    {
      validator: buildOptionalPatternValidator(
        "Postal code",
        CUSTOMER_PATTERNS.postalCode,
        "Please enter a valid postal code.",
        6,
      ),
      trigger: "blur",
    },
  ],
  industry: [{ validator: buildOptionalLengthValidator("Industry", CUSTOMER_FIELD_LIMITS.industryMax), trigger: "blur" }],
  annualRevenue: [{ validator: validateNonNegativeNumber("Annual revenue"), trigger: "blur" }],
  employeeCount: [{ validator: validateNonNegativeNumber("Employee count", true), trigger: "blur" }],
  wechat: [{ validator: buildOptionalLengthValidator("WeChat ID", CUSTOMER_FIELD_LIMITS.wechatMax), trigger: "blur" }],
  qq: [
    {
      validator: buildOptionalPatternValidator(
        "QQ number",
        CUSTOMER_PATTERNS.qq,
        "Please enter a valid QQ number.",
        11,
      ),
      trigger: "blur",
    },
  ],
  linkedin: [{ validator: buildOptionalUrlValidator("LinkedIn profile", CUSTOMER_FIELD_LIMITS.linkedinMax), trigger: "blur" }],
  twitter: [{ validator: buildOptionalUrlValidator("Twitter profile", CUSTOMER_FIELD_LIMITS.twitterMax), trigger: "blur" }],
  description: [
    { validator: buildOptionalLengthValidator("Description", CUSTOMER_FIELD_LIMITS.descriptionMax), trigger: "blur" },
  ],
  remark: [{ validator: buildOptionalLengthValidator("Remark", CUSTOMER_FIELD_LIMITS.remarkMax), trigger: "blur" }],
  tags: [{ validator: validateTags, trigger: "change" }],
});
