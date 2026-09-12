const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function run() {
  const form = new FormData();
  form.append('backup', fs.createReadStream('dummy.zip'));
  try {
    const res = await axios.post('http://localhost:3000/api/system/backup/restore', form, {
      headers: form.getHeaders(),
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response ? err.response.data : err.message);
  }
}
run();
