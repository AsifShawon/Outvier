export const CRICOS_RESOURCES = {
  INSTITUTIONS: {
    id: "7f6941f3-5327-4db7-b556-5f16d77f63c1",
    name: "CRICOS Institutions",
  },
  COURSES: {
    id: "48cacf69-2082-415e-9595-f17d0c3a4af0",
    name: "CRICOS Courses",
  },
  LOCATIONS: {
    id: "45d29535-1360-4486-8242-3850e61b5524",
    name: "CRICOS Locations",
  },
  COURSE_LOCATIONS: {
    id: "4cd2de02-8ba3-4eb2-bac2-fe272cae3f5f",
    name: "CRICOS Course Locations",
  },
};

export const CKAN_ENDPOINTS = {
  BASE_URL: process.env.CRICOS_CKAN_BASE_URL || "https://data.gov.au/data/api/action",
  DATASTORE_SEARCH: "/datastore_search",
  DATASTORE_SEARCH_SQL: "/datastore_search_sql",
};

export const CRICOS_CONFIG = {
  SYNC_LIMIT: parseInt(process.env.CRICOS_SYNC_LIMIT || "5000"),
  USE_TOKEN: process.env.CRICOS_SYNC_USE_TOKEN === "true",
  API_TOKEN: process.env.DATA_GOV_AU_API_TOKEN || "",
};
