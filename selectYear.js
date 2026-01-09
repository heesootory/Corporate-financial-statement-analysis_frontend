let startYear = null;
let endYear = null;

document.querySelectorAll(".point").forEach((point) => {
  point.addEventListener("click", function () {
    const year = parseInt(this.dataset.year);
    if (startYear === null) {
      startYear = year;
      this.classList.add("selected");
    } else if (endYear === null) {
      if (year === startYear) {
        // deselect
        startYear = null;
        this.classList.remove("selected");
      } else {
        endYear = year;
        this.classList.add("selected");
        updateRange();
      }
    } else {
      // reset
      resetSelection();
      startYear = year;
      this.classList.add("selected");
    }
  });
});

function updateRange() {
  if (startYear !== null && endYear !== null) {
    const min = Math.min(startYear, endYear);
    const max = Math.max(startYear, endYear);
    const rangeSelected = document.getElementById("rangeSelected");
    const bar = document.getElementById("rangeBar");
    const barWidth = bar.offsetWidth;
    const startPercent = ((min - 2020) / 4) * 100;
    const endPercent = ((max - 2020) / 4) * 100;
    rangeSelected.style.left = startPercent + "%";
    rangeSelected.style.width = endPercent - startPercent + "%";
    document.getElementById(
      "selectedRange"
    ).textContent = `선택된 범위: ${min} - ${max}`;
    document.getElementById("queryButton").disabled = false;
    document.querySelectorAll(".point").forEach((point) => {
      const year = parseInt(point.dataset.year);
      if (year >= min && year <= max) {
        point.classList.add("selected");
      }
    });
  }
}

function resetSelection() {
  startYear = null;
  endYear = null;
  document.querySelectorAll(".point").forEach((point) => {
    point.classList.remove("selected");
  });
  const rangeSelected = document.getElementById("rangeSelected");
  rangeSelected.style.left = "0%";
  rangeSelected.style.width = "0%";
  document.getElementById("selectedRange").textContent = "선택된 범위: 없음";
  document.getElementById("queryButton").disabled = true;
}

document.getElementById("queryButton").addEventListener("click", function () {
  if (this.disabled) {
    alert("기간을 설정해주세요");
  } else {
    const min = Math.min(startYear, endYear);
    const max = Math.max(startYear, endYear);
    findGrowthStocks(min, max);
  }
});

// 연도별 기간의 min, max 값 get요청 -> 해당기간의 연속 상승주 조회
async function findGrowthStocks(min, max) {
  try {
    // 1. fetch 요청 (백엔드의 @RequestParam 이름인 minYear, maxYear와 일치시킴)
    const response = await fetch(
      //`/proxy-api/findGrowthStocks?minYear=${min}&maxYear=${max}`
      `http://127.0.0.1:8080/findGrowthStocks?minYear=${min}&maxYear=${max}`
    );

    // 2. HTTP 상태 코드가 200(OK)이 아닐 경우 에러 처리
    if (!response.ok) {
      throw new Error(`서버 에러: ${response.status}`);
    }

    // 3. 응답 데이터를 JSON 객체로 파싱
    const result = await response.json();

    // 4. 결과 데이터 활용
    console.log("전체 응답:", result);
    console.log("찾은 기업 수:", result.count);
    console.log("기업 리스트:", result.data);

    // TODO: 화면에 데이터를 그리는 함수 호출 (예: renderTable(result.data))
    renderStocks(result);
  } catch (error) {
    console.error("데이터 조회 중 오류 발생:", error);
    alert("데이터를 가져오는 데 실패했습니다.");
  }
}
// 화면에 기업 데이터를 카드 형태로 렌더링하는 함수
function renderStocks(result) {
  const container = document.getElementById("resultsContainer");
  const min = Math.min(startYear, endYear);
  const max = Math.max(startYear, endYear);
  const years = [];
  for (let y = min; y <= max; y++) {
    years.push(y);
  }

  // 카드 생성
  const cards = result.data.map((item) => {
    const card = document.createElement("div");
    card.className = "stock-card";
    card.innerHTML = `
      <div style="text-align: left; font-weight: bold;">${item.corpName} (${
      item.corpCode
    })</div>
      <table>
        <tr><th>연도</th><th>매출액(억원)</th><th>매출액상승률</th><th>영업이익(억원)</th><th>영업이익상승률</th></tr>
        ${years
          .map((y, i) => {
            const rev = item.financialData["rev_" + y];
            const op = item.financialData["op_" + y];
            const prevRev =
              i > 0 ? item.financialData["rev_" + years[i - 1]] : null;
            const prevOp =
              i > 0 ? item.financialData["op_" + years[i - 1]] : null;
            const revPercent =
              prevRev && prevRev !== 0
                ? Math.abs(((rev - prevRev) / prevRev) * 100).toFixed(1)
                : null;
            const opPercent =
              prevOp && prevOp !== 0
                ? Math.abs(((op - prevOp) / prevOp) * 100).toFixed(1)
                : null;
            const revDisplay = rev ? Math.round(rev / 100000000) : "-";
            const opDisplay = op ? Math.round(op / 100000000) : "-";
            const revPercentDisplay = revPercent
              ? `<span style="color: green;">${revPercent}%</span>`
              : "-";
            const opPercentDisplay = opPercent
              ? `<span style="color: green;">${opPercent}%</span>`
              : "-";
            return `<tr><td>${y}</td><td>${revDisplay}</td><td>${revPercentDisplay}</td><td>${opDisplay}</td><td>${opPercentDisplay}</td></tr>`;
          })
          .join("")}
      </table>
    `;
    return card;
  });

  // 페이징 변수
  let currentPage = 1;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(cards.length / itemsPerPage);

  // 페이지 렌더링 함수
  function renderPage(page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageCards = cards.slice(start, end);
    container.innerHTML =
      `<p>총 ${result.count}개의 기업을 찾았습니다.</p>` +
      pageCards.map((c) => c.outerHTML).join("") +
      generatePagination();

    // 페이지 이동 시 화면 상단으로 자동 스크롤
    window.scrollTo(0, 0);
  }

  // 페이징 버튼 생성
  function generatePagination() {
    let html = '<div class="pagination">';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button onclick="renderPage(${i})">${i}</button>`;
    }
    html += "</div>";
    return html;
  }

  // 전역 함수로 등록 (페이징 버튼에서 호출)
  window.renderPage = renderPage;

  // 첫 페이지 렌더링
  renderPage(1);
}
