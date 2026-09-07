const textInput = document.getElementById('textInput');
const sizeSelect = document.getElementById('sizeSelect');
const levelSelect = document.getElementById('levelSelect');
const qrPreview = document.getElementById('qrPreview');
const downloadBtn = document.getElementById('downloadBtn');

let qrcode = null;

function render() {
  const text = textInput.value.trim() || 'https://example.com';
  const size = Number(sizeSelect.value);
  const level = levelSelect.value;

  qrPreview.innerHTML = '';
  qrcode = new QRCode(qrPreview, {
    text,
    width: size,
    height: size,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel[level],
  });
}

let debounceTimer;
function scheduleRender() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(render, 250);
}

textInput.addEventListener('input', scheduleRender);
sizeSelect.addEventListener('change', render);
levelSelect.addEventListener('change', render);

downloadBtn.addEventListener('click', () => {
  const canvas = qrPreview.querySelector('canvas');
  if (!canvas) return;
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = 'qrcode.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

render();
