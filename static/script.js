$(document).ready(function() {
    var selectedCoins = [];

    $.get("/coins", function(data) {
        data.forEach(function(coin) {
            $('#coinSelect').append(`
                <option value="${coin}">${coin}</option>
            `);
        });
    });

    $('#addCoinButton').click(function() {
        var selectedOptions = $('#coinSelect').val();
        
        selectedOptions.forEach(function(coin) {
            if (!selectedCoins.includes(coin)) {
                selectedCoins.push(coin);
                $('#selectedCoins').append(`
                    <div class="selected-coin" data-coin="${coin}">
                        ${coin} <span class="remove-coin">x</span>
                    </div>
                `);
            }
        });
    });

    $('#analyzeButton').click(function() {
        if (selectedCoins.length > 0) {
            $.ajax({
                url: '/analyze',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ coins: selectedCoins }),  
                success: function(results) {
                    var resultHtml = '';
                    results.forEach(function(result) {
                        resultHtml += `
                            <div class="result-item">
                                <h4>Đồng Coin: ${result.symbol}</h4>
                                <p><strong>Tín hiệu:</strong> ${result.signal}</p>
                                <p><strong>Giá dự đoán:</strong> ${result.predicted_price_label} ${result.predicted_price.toFixed(2)}</p>
                                <p><strong>Biến động:</strong> ${result.volatility}</p>
                                <p><strong>XU Hướng:</strong> ${result.trend_direction}</p>
                                <p><strong>Kết luận:</strong> ${result.final_conclusion}</p>
                            </div>
                        `;
                    });
                    $('#analysisResults').html(resultHtml);
                },
                error: function() {
                    alert("Có lỗi xảy ra khi phân tích dữ liệu. Vui lòng thử lại!");
                }
            });
        } else {
            alert("Vui lòng chọn ít nhất một đồng coin.");
        }
    });

    $('#selectedCoins').on('click', '.remove-coin', function() {
        var coin = $(this).parent().data('coin');
        selectedCoins = selectedCoins.filter(function(item) {
            return item !== coin;
        });
        $(this).parent().remove();
    });
});
