$(document).ready(function() {
    var selectedCoins = [];

    // Lấy danh sách các đồng coin từ API
    $.get("/coins", function(data) {
        data.forEach(function(coin) {
            $('#coinSelect').append(`
                <option value="${coin}">${coin}</option>
            `);
        });
    });

    // Thêm đồng coin vào danh sách
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

    // Chọn tất cả các đồng coin
    $('#selectAllButton').click(function() {
        selectedCoins = [];
        $('#coinSelect option').each(function() {
            var coin = $(this).val();
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

    // Phân tích các đồng coin đã chọn
    $('#analyzeButton').click(function() {
        if (selectedCoins.length > 0) {
            $('#loading').show(); // Hiển thị thông báo tải
            $.ajax({
                url: '/analyze',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ coins: selectedCoins }),  
                success: function(results) {
                    var resultHtml = '';
                    results.forEach(function(result) {
                        try {
                            var predictedPrice = result.predicted_price.toFixed(2);
                            resultHtml += `
                                <div class="result-item">
                                    <h4>Đồng Coin: ${result.symbol}</h4>
                                    <p><strong>Tín hiệu:</strong> ${result.signal}</p>
                                    <p><strong>Giá dự đoán:</strong> ${result.predicted_price_label} ${predictedPrice}</p>
                                    <p><strong>Biến động:</strong> ${result.volatility}</p>
                                    <p><strong>XU Hướng:</strong> ${result.trend_direction}</p>
                                    <p><strong>Kết luận:</strong> ${result.final_conclusion}</p>
                                </div>
                            `;
                        } catch (e) {
                            console.error('Lỗi phân tích với đồng coin', result.symbol, e);
                        }
                    });
                    $('#analysisResults').html(resultHtml);
                    $('#loading').hide(); // Ẩn thông báo tải
                },
                error: function() {
                    alert("Có lỗi xảy ra khi phân tích dữ liệu. Vui lòng thử lại!");
                    $('#loading').hide();
                }
            });
        } else {
            alert("Vui lòng chọn ít nhất một đồng coin.");
        }
    });

    // Xóa đồng coin khỏi danh sách đã chọn
    $('#selectedCoins').on('click', '.remove-coin', function() {
        var coin = $(this).parent().data('coin');
        selectedCoins = selectedCoins.filter(function(item) {
            return item !== coin;
        });
        $(this).parent().remove();
    });

    // Tìm kiếm trong kết quả phân tích
    $('#searchInput').on('input', function() {
        var searchTerm = $(this).val().toLowerCase();
        $('#analysisResults .result-item').each(function() {
            var text = $(this).text().toLowerCase();
            if (text.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
});