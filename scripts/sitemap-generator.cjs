const fs = require('fs');
const axios = require('axios');

const BASE_URL = 'https://otakutv.in';
const CONTENT_BASE = process.env.CONTENT_API_URL || 'https://otakutv.in/api/content';
const MANGA_BASE = process.env.MANGA_API_URL || 'https://otakutv.in/api/manga';

const ANIME_API = `${CONTENT_BASE}/api/anime`;
const MANGA_API = `${MANGA_BASE}/api/manga`;
const BLOG_API = `${CONTENT_BASE}/api/blogs`;
const REQUEST_TIMEOUT = 15000;
const PAGE_SIZE = 100;

function buildUrl(route, options = {}) {
    return {
        loc: `${BASE_URL}${route}`,
        changefreq: options.changefreq || 'weekly',
        priority: options.priority || '0.7',
        lastmod: options.lastmod,
    };
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function normalizeDate(value) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function fetchAnimePage(page) {
    const response = await axios.get(ANIME_API, {
        params: { page, limit: PAGE_SIZE },
        timeout: REQUEST_TIMEOUT,
    });

    const payload = response.data?.data || {};
    return {
        items: payload.anime || [],
        totalPages: payload.totalPages || 1,
    };
}

async function fetchMangaPage(page) {
    const response = await axios.get(MANGA_API, {
        params: { page, limit: PAGE_SIZE },
        timeout: REQUEST_TIMEOUT,
    });

    const payload = response.data?.data || {};
    return {
        items: payload.data || [],
        totalPages: payload.meta?.totalPages || 1,
    };
}

async function fetchBlogPage(page) {
    const response = await axios.get(BLOG_API, {
        params: { page, limit: PAGE_SIZE },
        timeout: REQUEST_TIMEOUT,
    });

    const payload = response.data?.data || {};
    return {
        items: payload.blogs || [],
        totalPages: payload.pagination?.totalPages || 1,
    };
}

async function collectPaginatedEntries(fetchPage, mapItem) {
    const entries = [];
    const seen = new Set();

    try {
        const firstPage = await fetchPage(1);
        const totalPages = Math.max(1, firstPage.totalPages || 1);

        const addItems = (items) => {
            for (const item of items) {
                const entry = mapItem(item);
                if (!entry || seen.has(entry.loc)) continue;
                seen.add(entry.loc);
                entries.push(entry);
            }
        };

        addItems(firstPage.items);

        for (let page = 2; page <= totalPages; page += 1) {
            const nextPage = await fetchPage(page);
            addItems(nextPage.items);
        }
    } catch (error) {
        console.warn(`Skipping dynamic sitemap entries: ${error.message}`);
    }

    return entries;
}

async function generateSitemap() {
    console.log('Generating sitemap...');

    const staticRoutes = [
        buildUrl('', { changefreq: 'daily', priority: '1.0' }),
        buildUrl('/anime', { changefreq: 'daily', priority: '0.9' }),
        buildUrl('/manga', { changefreq: 'daily', priority: '0.9' }),
        buildUrl('/manga/browse', { changefreq: 'daily', priority: '0.8' }),
        buildUrl('/episodes', { changefreq: 'daily', priority: '0.8' }),
        buildUrl('/blogs', { changefreq: 'daily', priority: '0.8' }),
        buildUrl('/contact', { changefreq: 'monthly', priority: '0.5' }),
    ];

    const animeRoutes = await collectPaginatedEntries(fetchAnimePage, (anime) => {
        if (!anime?.id) return null;

        return buildUrl(`/anime/${anime.id}`, {
            changefreq: 'weekly',
            priority: '0.8',
            lastmod: normalizeDate(anime.updatedAt || anime.createdAt),
        });
    });

    const mangaRoutes = await collectPaginatedEntries(fetchMangaPage, (manga) => {
        if (!manga?.id) return null;

        return buildUrl(`/manga/${manga.id}`, {
            changefreq: 'weekly',
            priority: '0.8',
            lastmod: normalizeDate(manga.updatedAt || manga.createdAt),
        });
    });

    const blogRoutes = await collectPaginatedEntries(fetchBlogPage, (blog) => {
        if (!blog?.slug) return null;

        return buildUrl(`/blogs/${blog.slug}`, {
            changefreq: 'weekly',
            priority: '0.8',
            lastmod: normalizeDate(blog.updatedAt || blog.createdAt),
        });
    });

    const urls = [...staticRoutes, ...animeRoutes, ...mangaRoutes, ...blogRoutes];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const url of urls) {
        xml += '  <url>\n';
        xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
        if (url.lastmod) {
            xml += `    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n`;
        }
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
        xml += `    <priority>${url.priority}</priority>\n`;
        xml += '  </url>\n';
    }

    xml += '</urlset>\n';

    fs.writeFileSync('./public/sitemap.xml', xml);
    console.log(`Sitemap generated successfully with ${urls.length} URLs at ./public/sitemap.xml`);
}

generateSitemap().catch((error) => {
    console.error('Sitemap generation failed:', error);
    process.exitCode = 1;
});
