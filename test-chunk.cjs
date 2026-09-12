const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function run() {
  const CHUNK_SIZE = 512 * 1024;
  const dummyFile = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB
  const totalChunks = Math.ceil(dummyFile.length / CHUNK_SIZE);
  const fileId = Date.now().toString();
  
  console.log("Total chunks: ", totalChunks);
  for (let i = 0; i < totalChunks; i++) {
    const chunk = dummyFile.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const form = new FormData();
    form.append('chunk', chunk, 'chunk');
    form.append('fileId', fileId);
    form.append('chunkIndex', i.toString());
    form.append('totalChunks', totalChunks.toString());
    
    try {
      await axios.post('http://localhost:3000/api/system/backup/restore-chunk', form, {
        headers: form.getHeaders(),
      });
      process.stdout.write('.');
    } catch (err) {
      console.log('\nError on chunk', i, err.response ? err.response.data : err.message);
      return;
    }
  }
  console.log("\nChunks uploaded, calling process...");
  
  try {
    const res = await axios.post('http://localhost:3000/api/system/backup/restore-process', {
      fileId, originalName: 'test.zip'
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response ? err.response.data : err.message);
  }
}
run();
