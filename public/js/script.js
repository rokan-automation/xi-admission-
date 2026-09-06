document.addEventListener('DOMContentLoaded', function () {
  // ---- ধাপে ধাপে ফরম (Personal Info -> SSC Info) ----
  const form = document.getElementById('admissionForm');
  if (form) {
    const steps = form.querySelectorAll('.form-step');
    const dots = document.querySelectorAll('[data-step-dot]');

    function showStep(n) {
      steps.forEach((s) => (s.hidden = s.dataset.step !== String(n)));
      dots.forEach((d) => d.classList.toggle('active', d.dataset.stepDot === String(n)));
      window.scrollTo({ top: form.offsetTop - 20, behavior: 'smooth' });
    }

    form.querySelectorAll('[data-next]').forEach((btn) =>
      btn.addEventListener('click', function () {
        const step1 = form.querySelector('.form-step[data-step="1"]');
        if (!step1.checkValidity()) {
          step1.reportValidity();
          return;
        }
        showStep(2);
      })
    );
    form.querySelectorAll('[data-back]').forEach((btn) =>
      btn.addEventListener('click', function () { showStep(1); })
    );
  }

  // ---- বাংলা ঘরে শুধু বাংলা, ইংরেজি ঘরে শুধু ইংরেজি ----
  const bnPattern = /[^\u0980-\u09FF\s.]/g;
  const enPattern = /[^A-Za-z\s.]/g;

  document.querySelectorAll('.input-bn').forEach((el) => {
    el.addEventListener('input', () => { el.value = el.value.replace(bnPattern, ''); });
  });
  document.querySelectorAll('.input-en').forEach((el) => {
    el.addEventListener('input', () => { el.value = el.value.replace(enPattern, ''); });
  });

  // ---- মোবাইল নম্বর: শুধু সংখ্যা, সর্বোচ্চ ১১ ডিজিট ----
  document.querySelectorAll('.input-digits').forEach((el) => {
    el.addEventListener('input', () => {
      el.value = el.value.replace(/[^0-9]/g, '').slice(0, 11);
    });
  });

  // ---- "Current Address এর মতোই" চেকবক্স ----
  const sameAddress = document.getElementById('sameAddress');
  if (sameAddress) {
    sameAddress.addEventListener('change', function () {
      const map = {
        present_village: 'permanent_village',
        present_post_office: 'permanent_post_office',
        present_thana: 'permanent_thana',
        present_district: 'permanent_district',
      };
      Object.entries(map).forEach(([from, to]) => {
        const fromEl = document.querySelector(`[name="${from}"]`);
        const toEl = document.querySelector(`[name="${to}"]`);
        if (!fromEl || !toEl) return;
        if (this.checked) {
          toEl.value = fromEl.value;
          toEl.readOnly = true;
        } else {
          toEl.readOnly = false;
        }
      });
    });
  }
});
