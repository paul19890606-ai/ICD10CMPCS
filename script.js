let allData = [];
let fuse;
const files = [
  { file: 'icd10cm_index_2023.json', label: '主索引' },
  { file: 'icd10cm_eindex_2023.json', label: '外部索引' },
  { file: 'icd10cm_tabular_2023.json', label: 'Tabular List' },
  { file: 'icd10cm_neoplasm_2023.json', label: '腫瘤索引' }
];

// 載入所有檔案
Promise.all(files.map(f => fetch(f.file).then(r => r.json())))
  .then(jsons => {
    allData = [];
    jsons.forEach((data, idx) => {
      if (Array.isArray(data)) {
        data.forEach(item => item._source = files[idx].label);
        allData = allData.concat(data);
      } else if (typeof data === 'object') {
        Object.keys(data).forEach(k => {
          if (Array.isArray(data[k])) {
            data[k].forEach(item => {
              item._source = files[idx].label;
              allData.push(item);
            });
          }
        });
      }
    });
    fuse = new Fuse(allData, {
      keys: ['code', 'description', 'term', 'title', 'desc', 'name'],
      threshold: 0.3
    });
  });

function searchICD() {
  const query = document.getElementById('searchInput').value.trim();
  const scope = document.getElementById('scopeSelect').value;
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (!query) {
    resultsDiv.innerHTML = '<p>請輸入搜尋關鍵字</p>';
    return;
  }

  let searchData = allData;
  if (scope !== 'all') {
    searchData = allData.filter(item => item._source === scope);
  }

  const fuseLocal = new Fuse(searchData, fuse.options);
  const results = fuseLocal.search(query);

  if (results.length === 0) {
    resultsDiv.innerHTML = '<p>找不到結果</p>';
  } else {
    results.forEach(({ item }) => {
      let display = '';
      if (item.code && item.description) {
        display = `<strong>${item.code}</strong>: ${item.description}`;
      } else if (item.term && item.code) {
        display = `<strong>${item.term}</strong>: ${item.code}`;
      } else if (item.title && item.desc) {
        display = `<strong>${item.title}</strong>: ${item.desc}`;
      } else if (item.name && item.desc) {
        display = `<strong>${item.name}</strong>: ${item.desc}`;
      } else {
        display = JSON.stringify(item);
      }
      display += `<br><span class="source">${item._source}</span>`;
      const div = document.createElement('div');
      div.className = 'result-item';
      div.innerHTML = display;
      resultsDiv.appendChild(div);
    });
  }
}
