export default function sitemap() {
  const baseUrl = 'https://rosso.auto';
  const now = new Date();

  return [
    { url: `${baseUrl}/`,           lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/#services`,  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/#booking`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/#faq`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/ar`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
  ];
}
