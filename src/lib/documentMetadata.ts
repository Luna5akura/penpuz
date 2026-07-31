interface DocumentMetadata {
  title: string;
  description: string;
  url?: string;
  type?: 'website' | 'article';
}

function getOrCreateNamedMeta(name: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  return element;
}

function getOrCreatePropertyMeta(property: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  return element;
}

function setNamedMeta(name: string, content: string) {
  getOrCreateNamedMeta(name).content = content;
}

function setPropertyMeta(property: string, content: string) {
  getOrCreatePropertyMeta(property).content = content;
}

export function setDocumentMetadata({ title, description, url, type = 'website' }: DocumentMetadata) {
  if (typeof document === 'undefined') return;

  document.title = title;
  setNamedMeta('description', description);
  setPropertyMeta('og:title', title);
  setPropertyMeta('og:description', description);
  setPropertyMeta('og:type', type);
  setNamedMeta('twitter:card', 'summary');
  setNamedMeta('twitter:title', title);
  setNamedMeta('twitter:description', description);

  if (url) {
    setPropertyMeta('og:url', url);
  }
}
