CREATE TABLE place (
    id SERIAL PRIMARY KEY,
    name TEXT,
    type TEXT,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    address TEXT
);

CREATE TABLE item (
    id SERIAL PRIMARY KEY,
    title TEXT,
    price TEXT,
    location TEXT,
    link TEXT
);