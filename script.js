const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

let chat_id = null;

if (tg.initDataUnsafe && tg.initDataUnsafe.user)
	{
		chat_id = tg.initDataUnsafe.user.id;
	}
	console.log("Telegram chat/user ID:", chat_id);

document.addEventListener('DOMContentLoaded', () => {
    // مدیریت دکمه تغییر تم
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('light-theme')) {
            body.classList.replace('light-theme', 'dark-theme');
            themeToggleBtn.textContent = '☀️';
        } else {
            body.classList.replace('dark-theme', 'light-theme');
            themeToggleBtn.textContent = '🌙';
        }
    });

    // محاسبه خودکار تعداد کل مسافران
    const adultInput = document.getElementById('adult_count');
    const childInput = document.getElementById('child_count');
    const totalInput = document.getElementById('total-passengers');

    function updateTotalPassengers() {
        const adults = parseInt(adultInput.value) || 0;
        const children = parseInt(childInput.value) || 0;
        totalInput.value = adults + children;
    }

    adultInput.addEventListener('input', updateTotalPassengers);
    childInput.addEventListener('input', updateTotalPassengers);

    // فعال‌سازی تقویم شمسی برای تاریخ رفت و برگشت
    $('#departure_date').persianDatepicker({
        format: 'YYYY/MM/DD',
        initialValue: false,
        autoClose: true,
        toolbox: {
            calendarSwitch: {
                enabled: false
            }
        }
    });

    $('#return_date').persianDatepicker({
        format: 'YYYY/MM/DD',
        initialValue: false,
        autoClose: true,
        toolbox: {
            calendarSwitch: {
                enabled: false
            }
        }
    });

    // پاک کردن پیام خطا هنگام تایپ
    const requiredFields = ['name', 'phone', 'origin', 'destination', 'departure_date', 'return_date'];
    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.addEventListener('input', () => clearError(field));
            input.addEventListener('change', () => clearError(field));
        }
    });

    // اعتبارسنجی فرم
    const form = document.getElementById('tour-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // پاک کردن همه خطاهای قبلی
        requiredFields.forEach(field => clearError(field));

        let isValid = true;

        // بررسی فیلدهای اجباری
        const name = document.getElementById('name').value.trim();
        if (!name) {
            showError('name', 'لطفاً نام و نام خانوادگی را وارد کنید');
            isValid = false;
        }

        const phone = document.getElementById('phone').value.trim();
        if (!phone) {
            showError('phone', 'لطفاً شماره موبایل را وارد کنید');
            isValid = false;
        } else if (!/^\d{11}$/.test(phone)) {
            showError('phone', 'شماره موبایل باید دقیقاً ۱۱ رقم باشد');
            isValid = false;
        }

        const origin = document.getElementById('origin').value.trim();
        if (!origin) {
            showError('origin', 'لطفاً مبدأ را وارد کنید');
            isValid = false;
        }

        const destination = document.getElementById('destination').value.trim();
        if (!destination) {
            showError('destination', 'لطفاً مقصد را وارد کنید');
            isValid = false;
        }

        const departureDate = document.getElementById('departure_date').value.trim();
        if (!departureDate) {
            showError('departure_date', 'لطفاً تاریخ رفت را وارد کنید');
            isValid = false;
        }

        const returnDate = document.getElementById('return_date').value.trim();
        if (!returnDate) {
            showError('return_date', 'لطفاً تاریخ برگشت را وارد کنید');
            isValid = false;
        }

        // بررسی معتبر بودن تاریخ‌ها (برگشت بعد از رفت)
        if (departureDate && returnDate) {
            const depParts = departureDate.split('/').map(Number);
            const retParts = returnDate.split('/').map(Number);

            if (depParts.length === 3 && retParts.length === 3) {
                // مقایسه سال، ماه، روز
                const depValue = depParts[0] * 10000 + depParts[1] * 100 + depParts[2];
                const retValue = retParts[0] * 10000 + retParts[1] * 100 + retParts[2];

                if (retValue < depValue) {
                    showError('return_date', 'تاریخ برگشت نمی‌تواند قبل از تاریخ رفت باشد');
                    isValid = false;
                }
            }
        }

        if (!isValid) {
            return;
        }

        // ساخت آبجکت داده با نام فیلدهای مشخص شده
        const formData = {
            chat_id: chat_id,
            name: name,
            phone: phone,
            destination: destination,
            origin: origin,
            departure_date: departureDate,
            return_date: returnDate,
            adult_count: parseInt(adultInput.value) || 0,
            child_count: parseInt(childInput.value) || 0,
            total_passengers: (parseInt(adultInput.value) || 0) + (parseInt(childInput.value) || 0),
            hotel_rating: document.getElementById('hotel_rating').value,
            room_type: document.getElementById('room_type').value,
            budget: document.getElementById('budget').value.trim(),
            description: document.getElementById('description').value.trim()
        };

        fetch("https://unstitch-rocky-antonym.ngrok-free.dev/webhook/tour-request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(result => {
                console.log("ارسال شد:", result);
                alert("درخواست شما با موفقیت ثبت شد!");
            })
            .catch(error => {
                console.error("خطا:", error);
                alert("ارسال اطلاعات با مشکل مواجه شد");
            });
        // form.reset(); // در صورت نیاز می‌توانید فرم را ریست کنید
        // updateTotalPassengers();
    });

    function showError(fieldId, message) {
        const errorEl = document.getElementById(fieldId + '-error');
        const inputEl = document.getElementById(fieldId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
        if (inputEl) {
            inputEl.classList.add('input-error');
        }
    }

    function clearError(fieldId) {
        const errorEl = document.getElementById(fieldId + '-error');
        const inputEl = document.getElementById(fieldId);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
        if (inputEl) {
            inputEl.classList.remove('input-error');
        }
    }
});
