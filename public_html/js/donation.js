// donation.js
document.addEventListener('DOMContentLoaded', function() {
    const donateBtn = document.getElementById('donateBtn');
    if (!donateBtn) return;
    
    donateBtn.addEventListener('click', function() {
        const form = document.createElement('form');
        form.method = 'post';
        form.action = 'https://www.paypal.com/donate';
        form.target = '_blank';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'hosted_button_id';
        input.value = 'FKJPST5LWBUGG';
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    });
});