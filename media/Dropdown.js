class Dropdown {
  constructor(id, showInfo, dropdownType, changeCallback) {
    this.options = [];
    this.selectedOption = 0;
    this.dropdownVisible = false;
    this.showInfo = showInfo;
    this.changeCallback = changeCallback;
    this.elem = document.getElementById(id);
    var filter = document.createElement('div');
    filter.className = 'dropdownFilter';
    this.filterInput = document.createElement('input');
    this.filterInput.className = 'dropdownFilterInput';
    this.filterInput.placeholder = 'Filter ' + dropdownType + '...';
    filter.appendChild(this.filterInput);
    this.menuElem = document.createElement('div');
    this.menuElem.className = 'dropdownMenu';
    this.menuElem.appendChild(filter);
    this.optionsElem = document.createElement('div');
    this.optionsElem.className = 'dropdownOptions';
    this.menuElem.appendChild(this.optionsElem);
    this.noResultsElem = document.createElement('div');
    this.noResultsElem.className = 'dropdownNoResults';
    this.noResultsElem.innerHTML = 'No results found.';
    this.menuElem.appendChild(this.noResultsElem);
    this.currentValueElem = document.createElement('div');
    this.currentValueElem.className = 'dropdownCurrentValue';
    this.elem.appendChild(this.currentValueElem);
    this.elem.appendChild(this.menuElem);
    const _this = this;
    document.addEventListener(
      'click',
      function(e) {
        if (!e.target) {
          return;
        }
        if (e.target === _this.currentValueElem) {
          _this.dropdownVisible = !_this.dropdownVisible;
          if (_this.dropdownVisible) {
            _this.filterInput.value = '';
            _this.filter();
          }
          _this.elem.classList.toggle('dropdownOpen');
          if (_this.dropdownVisible) {
            _this.filterInput.focus();
          }
        } else if (_this.dropdownVisible) {
          if (e.target.closest('.dropdown') !== _this.elem) {
            _this.close();
          } else {
            var option = e.target.closest('.dropdownOption');
            if (
              option != null &&
              option.parentNode === _this.optionsElem &&
              typeof option.dataset.id !== 'undefined'
            ) {
              var selectedOption = parseInt(option.dataset.id);
              _this.close();
              if (_this.selectedOption !== selectedOption) {
                _this.selectedOption = selectedOption;
                _this.render();
                _this.changeCallback(_this.options[_this.selectedOption].value);
              }
            }
          }
        }
      },
      true
    );
    document.addEventListener(
      'contextmenu',
      function() {
        return _this.close();
      },
      true
    );
    document.addEventListener(
      'keyup',
      function(e) {
        if (e.key === 'Escape') {
          _this.close();
        }
      },
      true
    );
    this.filterInput.addEventListener('keyup', function() {
      return _this.filter();
    });
  }

  setOptions(options, selected) {
    this.options = options;
    var selectedOption = 0;
    for (var i = 0; i < options.length; i++) {
      if (options[i].value === selected) {
        selectedOption = i;
      }
    }
    this.selectedOption = selectedOption;
    if (options.length <= 1) {
      this.close();
    }
    this.render();
  }

  refresh() {
    if (this.options.length > 0) {
      this.render();
    }
  }

  render() {
    this.elem.classList.add('loaded');
    this.currentValueElem.innerHTML = this.options[this.selectedOption].name;
    var html = '';
    for (var i = 0; i < this.options.length; i++) {
      html +=
        '<div class="dropdownOption' +
        (this.selectedOption === i ? ' selected' : '') +
        '" data-id="' +
        i +
        '">' +
        escapeHtml(this.options[i].name) +
        (this.showInfo
          ? '<div class="dropdownOptionInfo" title="' +
            escapeHtml(this.options[i].value) +
            '">' +
            svgIcons.info +
            '</div>'
          : '') +
        '</div>';
    }
    this.optionsElem.className = 'dropdownOptions' + (this.showInfo ? ' showInfo' : '');
    this.optionsElem.innerHTML = html;
    this.filterInput.style.display = 'none';
    this.noResultsElem.style.display = 'none';
    this.menuElem.style.cssText = 'opacity:0; display:block;';
    this.currentValueElem.style.width =
      Math.max(this.menuElem.offsetWidth + (this.showInfo && this.menuElem.offsetHeight < 272 ? 0 : 12), 130) + 'px';
    this.menuElem.style.cssText = 'right:0; overflow-y:auto; max-height:297px;';
    if (this.dropdownVisible) {
      this.filter();
    }
  }

  filter() {
    var val = this.filterInput.value.toLowerCase(),
      match,
      matches = false;
    for (var i = 0; i < this.options.length; i++) {
      match = this.options[i].name.toLowerCase().indexOf(val) > -1;
      this.optionsElem.children[i].style.display = match ? 'block' : 'none';
      if (match) {
        matches = true;
      }
    }
    this.filterInput.style.display = 'block';
    this.noResultsElem.style.display = matches ? 'none' : 'block';
  }

  close() {
    this.elem.classList.remove('dropdownOpen');
    this.dropdownVisible = false;
  }
}
