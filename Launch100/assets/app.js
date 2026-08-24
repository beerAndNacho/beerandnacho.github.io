const galleryStyles = document.createElement('link');
galleryStyles.rel = 'stylesheet';
galleryStyles.href = './assets/template-gallery-v2.css';
document.head.appendChild(galleryStyles);

const launchParams = new URLSearchParams(location.search);
import('./app-v2.js').then(() => {
  const requestedTemplate = launchParams.get('template');
  if (!requestedTemplate || launchParams.has('preview')) return;
  requestAnimationFrame(() => {
    document.querySelector(`[data-select-template="${CSS.escape(requestedTemplate)}"]`)?.click();
  });
});
