// Heart of Bibi — shared state (shells + initials; imports nothing: cycle-free hub)

export const Bibi = { 'version': ENV_VERSION, 'href': 'https://bibi.epub.link', Status: '', TimeOrigin: Date.now() }; /**/ Bibi.Dev = Bibi.Development = ENV_DEVELOPMENT;

export const L = { // Bibi.Loader
    Opened: false
};

export const R = { // Bibi.Reader
    Spreads: [], Items: [], Pages: [],
    NonLinearItems: [],
    IntersectingPages: [], Current: {}
};

export const I = {}; // Bibi.UserInterfaces

export const P = {}; // Bibi.Preset

export const U = {};

export const D = {};

export const S = {}; // Bibi.Settings

export const C = {};

export const O = {}; // Bibi.Operator

export const E = {};

export const M = {}; // Bibi.Messages

export const X = { // Bibi.Extensions
    Bibi: {}, Extensions: [], Extractor: null
};
