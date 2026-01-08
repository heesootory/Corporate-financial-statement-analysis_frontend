async function springBootConnectionTest() {
  const response = await fetch("/proxy-api/test");

  const result = await response.text();

  console.log(result);
}

// 모든 종목 조회 함수.
async function findAllStocks() {
  const response = await fetch("/proxy-api/allStocks");

  const result = await response.text();

  console.log(result);
}

// 정상 상장 기업들 플래그 체크 함수.
async function updateExist() {
  const response = await fetch("/proxy-api/updateExist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = await response.text();

  console.log(result);
}

// 매출액과 영업이익 데이터 삽입 함수.
async function insertData() {
  const response = await fetch("/proxy-api/insertReAndOpData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result = await response.text();

  console.log(result);
}

// 성장주 조회 함수.
async function findGrowthStockS(min, max) {
  const response = await fetch(
    `/proxy-api/findGrowthStockS?min=${min}&max=${max}`
  );

  const result = await response.text();

  console.log(result);
}
