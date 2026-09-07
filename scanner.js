const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const cameraBtn = document.getElementById('cameraBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const msg = document.getElementById('msg');
const resultBox = document.getElementById('resultBox');
const resultText = document.getElementById('resultText');
const resultActions = document.getElementById('resultActions');
const copyBtn = document.getElementById('copyBtn');
const openLink = document.getElementById('openLink');

let stream = null;
let scanLoopId = null;

function setMessage(text, type) {
  msg.textContent = text;
  msg.className = 'msg' + (type ? ` ${type}` : '');
}

function showResult(text) {
  resultBox.hidden = false;
  resultActions.hidden = false;
  resultText.textContent = text;
  const looksLikeUrl = /^https?:\/\//i.test(text.trim());
  if (looksLikeUrl) {
    openLink.hidden = false;
    openLink.href = text.trim();
  } else {
    openLink.hidden = true;
  }
}

function decodeImageData(imageData) {
  return jsQR(imageData.data, imageData.width, imageData.height);
}

function decodeFile(file) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    const code = decodeImageData(imageData);
    if (code) {
      showResult(code.data);
      setMessage('QR code found.', 'success');
    } else {
      setMessage('No QR code found in this image.', 'error');
    }
  };
  img.onerror = () => setMessage('Could not load this image.', 'error');
  img.src = URL.createObjectURL(file);
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (ev) => { ev.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (ev) => {
  ev.preventDefault();
  dropzone.classList.remove('dragover');
  const file = ev.dataTransfer.files[0];
  if (file) decodeFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) decodeFile(file);
  fileInput.value = '';
});

function stopCamera() {
  if (scanLoopId) cancelAnimationFrame(scanLoopId);
  scanLoopId = null;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.hidden = true;
  stopCameraBtn.hidden = true;
  cameraBtn.hidden = false;
}

function scanFrame() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = decodeImageData(imageData);
    if (code) {
      showResult(code.data);
      setMessage('QR code found.', 'success');
      stopCamera();
      return;
    }
  }
  scanLoopId = requestAnimationFrame(scanFrame);
}

cameraBtn.addEventListener('click', async () => {
  setMessage('');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    video.hidden = false;
    await video.play();
    cameraBtn.hidden = true;
    stopCameraBtn.hidden = false;
    scanLoopId = requestAnimationFrame(scanFrame);
  } catch (err) {
    setMessage('Could not access camera: ' + (err.message || 'permission denied'), 'error');
  }
});

stopCameraBtn.addEventListener('click', stopCamera);

copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(resultText.textContent);
  setMessage('Copied to clipboard.', 'success');
});
