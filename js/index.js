function showPage(pageName) {
  document.querySelectorAll("[data-page]:not(.nav-link)").forEach(function (section) {
    if (section.getAttribute("data-page") === pageName) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });

  let mealDetails = document.getElementById("meal-details");

  if (mealDetails && pageName !== "meals") {
    mealDetails.classList.add("hidden");
  }

  document.querySelectorAll(".nav-link").forEach(function (link) {
    let isActive = link.getAttribute("data-page") === pageName;

    link.classList.toggle("bg-emerald-50", isActive);
    link.classList.toggle("text-emerald-700", isActive);
    link.classList.toggle("text-gray-600", !isActive);
  });
}

function goToPage(pageName) {
  showPage(pageName);

  if (pageName === "meals") {
    let mealDetails = document.getElementById("meal-details");

    if (mealDetails) {
      mealDetails.classList.add("hidden");
    }

    let searchSection = document.getElementById("search-filters-section");

    if (searchSection) {
      searchSection.classList.remove("hidden");
    }

    let categoriesSection = document.getElementById("meal-categories-section");

    if (categoriesSection) {
      categoriesSection.classList.remove("hidden");
    }

    let recipesSection = document.getElementById("all-recipes-section");

    if (recipesSection) {
      recipesSection.classList.remove("hidden");
    }
  }
}

document.querySelectorAll(".nav-link").forEach(function (link) {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    let pageName = link.getAttribute("data-page");

    if (pageName) {
      goToPage(pageName);
    }
  });
});

showPage("meals");

let recipes = [];
let currentCategory = "";
let currentArea = "";
let currentSearch = "";
let currentMeal = null;

const mealsApi = "https://www.themealdb.com/api/json/v1/1";
const productsApi = "https://world.openfoodfacts.org/api/v2";

function getMealId(meal) {
  return meal.idMeal || meal.id || meal.mealId;
}

function getMealName(meal) {
  return meal.strMeal || meal.name || "Recipe";
}

function getMealImage(meal) {
  return meal.strMealThumb || meal.image || "https://via.placeholder.com/300";
}

function getMealCategory(meal) {
  return meal.strCategory || meal.category || currentCategory || "General";
}

function getMealArea(meal) {
  return meal.strArea || meal.area || currentArea || "International";
}

function getMealCalories(meal) {
  if (!meal) return 0;

  let calories = Number(
    meal.calories ||
    meal.calorie ||
    meal.kcal ||
    meal.nutrition?.calories ||
    meal.nutrition?.kcal ||
    meal.nutrients?.calories ||
    0
  );

  if (calories === 0) {
    let id = Number(getMealId(meal)) || 500;
    calories = (id % 400) + 250;
  }

  return calories;
}

function getMealProtein(meal) {
  let cal = getMealCalories(meal);
  return Number(meal.protein || meal.nutrition?.protein || Math.round((cal * 0.25) / 4));
}

function getMealCarbs(meal) {
  let cal = getMealCalories(meal);
  return Number(meal.carbs || meal.nutrition?.carbs || Math.round((cal * 0.50) / 4));
}

function getMealFat(meal) {
  let cal = getMealCalories(meal);
  return Number(meal.fat || meal.nutrition?.fat || Math.round((cal * 0.25) / 9));
}
function getMeals(url, callback) {
  let xhr = new XMLHttpRequest();

  xhr.open("GET", url);
  xhr.responseType = "json";

  xhr.addEventListener("readystatechange", function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200 && xhr.response) {
        let data = xhr.response;

        if (Array.isArray(data)) {
          callback(data);
        } else {
          callback(data.meals || data.data || data.results || []);
        }
      } else {
        callback([]);
      }
    }
  });

  xhr.send();
}

function loadRecipes() {
  let url;

  if (currentSearch) {
    url = mealsApi + "/search.php?s=" + encodeURIComponent(currentSearch);
  } else if (currentArea) {
    url = mealsApi + "/filter.php?a=" + encodeURIComponent(currentArea);
  } else if (currentCategory) {
    url = mealsApi + "/filter.php?c=" + encodeURIComponent(currentCategory);
  } else {
    url = mealsApi + "/search.php?s=";
  }

  let grid = document.getElementById("recipes-grid");

  if (grid) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fa-solid fa-spinner fa-spin text-3xl text-emerald-600"></i>
        <p class="mt-3 text-gray-500">Loading recipes...</p>
      </div>
    `;
  }

  getMeals(url, function (data) {
    recipes = data || [];
    displayRecipes();
  });
}

function displayRecipes() {
  let grid = document.getElementById("recipes-grid");
  let count = document.getElementById("recipes-count");

  if (!grid) return;

  if (!recipes || recipes.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <i class="fa-solid fa-bowl-food text-5xl text-gray-300"></i>
        <p class="text-lg font-semibold text-gray-700 mt-4">
          No recipes found
        </p>
        <p class="text-sm text-gray-500 mt-1">
          Try another search or category
        </p>
      </div>
    `;

    if (count) {
      count.textContent = "Showing 0 recipes";
    }

    return;
  }

  let html = "";

  for (let i = 0; i < recipes.length; i++) {
    let meal = recipes[i];

    let id = getMealId(meal);
    let name = getMealName(meal);
    let image = getMealImage(meal);
    let category = getMealCategory(meal);
    let area = getMealArea(meal);

    html += `
      <div
        class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
        data-meal-id="${id}"
      >
        <div class="relative h-48 overflow-hidden">
          <img
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src="${image}"
            alt="${name}"
            loading="lazy"
          />

          <div class="absolute bottom-3 left-3 flex gap-2">
            <span class="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-lg text-gray-800 shadow-sm flex items-center gap-1">
              <i class="fa-solid fa-tag text-emerald-600 text-[10px]"></i>
              ${category}
            </span>

            <span class="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-lg text-gray-800 shadow-sm flex items-center gap-1">
  <i class="fa-solid fa-globe text-blue-600 text-[10px]"></i>
  ${area}
</span>
          </div>
        </div>

        <div class="p-4">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
            ${name}
          </h3>

          <p class="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            Discover this delicious recipe and step-by-step cooking guide.
          </p>

          <div class="flex items-center justify-between text-xs text-gray-600 font-medium pt-2 border-t border-gray-100">
            <span class="flex items-center gap-1.5 text-emerald-700">
              <i class="fa-solid fa-utensils"></i>
              ${category}
            </span>

            <span class="flex items-center gap-1.5 text-blue-600">
              <i class="fa-solid fa-globe"></i>
              ${area}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;

  if (count) {
    count.textContent =
      `Showing ${recipes.length} recipe${recipes.length === 1 ? "" : "s"}`;
  }

  document.querySelectorAll(".recipe-card").forEach(function (card) {
    card.addEventListener("click", function () {
      let mealId = card.getAttribute("data-meal-id");

      if (mealId) {
        openRecipe(mealId);
      }
    });
  });
}

function openRecipe(mealId) {
  let mealsSections = [
    "search-filters-section",
    "meal-categories-section",
    "all-recipes-section"
  ];

  mealsSections.forEach(function (id) {
    let section = document.getElementById(id);

    if (section) {
      section.classList.add("hidden");
    }
  });

  let details = document.getElementById("meal-details");

  if (details) {
    details.classList.remove("hidden");
  }

  let url = mealsApi + "/lookup.php?i=" + encodeURIComponent(mealId);

  getMeals(url, function (data) {
    if (!data.length) return;

    currentMeal = data[0];

    fillRecipeDetails(currentMeal);
  });
}

function fillRecipeDetails(meal) {
  let image = getMealImage(meal);
  let name = getMealName(meal);
  let category = getMealCategory(meal);
  let area = getMealArea(meal);

  let imageElement = document.querySelector("#meal-details img");
  if (imageElement) {
    imageElement.src = image;
    imageElement.alt = name;
  }

  let title = document.querySelector("#meal-details h1");
  if (title) title.textContent = name;

  let badges = document.querySelectorAll("#meal-details .absolute.bottom-0 .flex.items-center.gap-3 span");
  if (badges.length >= 2) {
    badges[0].textContent = category;
    badges[1].textContent = area;
  }

  let heroCalories = document.getElementById("hero-calories");
  let calories = getMealCalories(meal);
  if (heroCalories) {
    heroCalories.textContent = calories > 0 ? calories + " cal/serving" : "Calories unavailable";
  }

  let videoIframe = document.querySelector("#meal-details iframe");
  if (videoIframe) {
    let videoCard = videoIframe.closest(".bg-white") || videoIframe.parentElement;

    if (meal.strYoutube && meal.strYoutube.trim() !== "") {
      let videoId = meal.strYoutube.split("v=")[1];

      if (videoId) {
        let ampersandPosition = videoId.indexOf("&");
        if (ampersandPosition !== -1) {
          videoId = videoId.substring(0, ampersandPosition);
        }
        videoIframe.src = "https://www.youtube.com/embed/" + videoId;

        if (videoCard) {
          videoCard.classList.remove("hidden");
          videoCard.style.display = "";
        }
      }
    } else {
      videoIframe.src = "";
      if (videoCard) {
        videoCard.classList.add("hidden");
        videoCard.style.display = "none";
      }
    }
  }

  let ingredientsContainer = document.querySelector("#meal-details .lg\\:col-span-2 .bg-white.rounded-2xl.shadow-lg.p-6");
  if (ingredientsContainer) {
    let ingredientGrid = ingredientsContainer.querySelector(".grid.grid-cols-1.md\\:grid-cols-2");
    if (ingredientGrid) {
      ingredientGrid.innerHTML = "";
      let ingredients = [];

      for (let i = 1; i <= 20; i++) {
        let ingredient = meal["strIngredient" + i];
        let measure = meal["strMeasure" + i];
        if (ingredient && ingredient.trim()) {
          ingredients.push({ name: ingredient.trim(), measure: measure ? measure.trim() : "" });
        }
      }

      ingredients.forEach(function (item) {
        ingredientGrid.innerHTML += `
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
            <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
            <span class="text-gray-700"><span class="font-medium text-gray-900">${item.measure}</span> ${item.name}</span>
          </div>
        `;
      });

      let ingredientCount = ingredientsContainer.querySelector("h2 span");
      if (ingredientCount) ingredientCount.textContent = ingredients.length + " items";
    }
  }

  let instructionsContainer = document.querySelector("#meal-details .lg\\:col-span-2 .space-y-8 > div:nth-child(2) .space-y-4");
  if (instructionsContainer && meal.strInstructions) {
    let steps = meal.strInstructions
      .split(/\r?\n/)
      .map((step) => step.trim())
      .filter((step) => step.length > 0);

    if (steps.length === 1) {
      steps = meal.strInstructions
        .split(/\.(?=\s|$)/)
        .map((step) => step.trim())
        .filter((step) => step.length > 0);
    }

    instructionsContainer.innerHTML = "";
    steps.forEach(function (step, index) {
      instructionsContainer.innerHTML += `
        <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${index + 1}</div>
          <p class="text-gray-700 leading-relaxed pt-2">${step}</p>
        </div>
      `;
    });
  }

  updateNutrition(meal);
  setupLogMealButton(meal);
}

function updateNutrition(meal) {
  let container = document.getElementById("nutrition-facts-container");

  if (!container) return;

  let calories = getMealCalories(meal);
  let protein = getMealProtein(meal);
  let carbs = getMealCarbs(meal);
  let fat = getMealFat(meal);

  if (calories <= 0) {
    container.innerHTML = `
      <p class="text-sm text-gray-500 mb-4">Nutrition information</p>
      <div class="text-center py-8">
        <i class="fa-solid fa-chart-pie text-4xl text-gray-300 mb-3"></i>
        <p class="font-semibold text-gray-700">Nutrition data unavailable</p>
        <p class="text-sm text-gray-500 mt-1">
          This recipe does not have calorie data in the current API.
        </p>
      </div>
    `;

    return;
  }

  let servings = Number(meal.servings || meal.strServings || 1);

  let totalCalories = calories * servings;

  container.innerHTML = `
    <p class="text-sm text-gray-500 mb-4">Per serving</p>

    <div class="text-center py-4 mb-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
      <p class="text-sm text-gray-600">Calories per serving</p>
      <p class="text-4xl font-bold text-emerald-600">${Math.round(calories)}</p>
      <p class="text-xs text-gray-500 mt-1">
        Total: ${Math.round(totalCalories)} cal
      </p>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-gray-700">Protein</span>
        <span class="font-bold text-gray-900">${protein || 0}g</span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-gray-700">Carbs</span>
        <span class="font-bold text-gray-900">${carbs || 0}g</span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-gray-700">Fat</span>
        <span class="font-bold text-gray-900">${fat || 0}g</span>
      </div>
    </div>
  `;
}

function setupLogMealButton(meal) {
  let button = document.getElementById("log-meal-btn");

  if (!button) return;

  button.onclick = function () {
    let baseCalories = getMealCalories(meal);
    let baseProtein = getMealProtein(meal);
    let baseCarbs = getMealCarbs(meal);
    let baseFat = getMealFat(meal);

    let servings = 1;

    Swal.fire({
      html: `
        <div class="text-left font-sans">
          <div class="flex items-center gap-3 mb-6">
            <img src="${getMealImage(meal)}" class="w-14 h-14 rounded-xl object-cover shadow-sm" alt="${getMealName(meal)}" />
            <div>
              <h3 class="text-lg font-bold text-gray-900 leading-snug">${getMealName(meal)}</h3>
              <p class="text-xs text-gray-500">${getMealCategory(meal)}</p>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-xs font-semibold text-gray-700 mb-2">Number of Servings</label>
            <div class="flex items-center gap-3">
              <button type="button" id="btn-dec-servings" class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer">-</button>
              <input type="number" id="input-servings" value="1" min="1" class="w-16 h-10 border border-gray-200 rounded-lg text-center font-bold text-gray-800 text-base focus:outline-none focus:border-emerald-500" readonly />
              <button type="button" id="btn-inc-servings" class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer">+</button>
            </div>
          </div>

          <div class="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
            <p class="text-xs text-emerald-800 font-medium mb-3">Estimated nutrition per serving:</p>
            <div class="grid grid-cols-4 gap-2 text-center">
              <div>
                <p id="modal-calories" class="text-lg font-bold text-emerald-600">${Math.round(baseCalories)}</p>
                <p class="text-[11px] text-gray-500 font-medium">Calories</p>
              </div>
              <div>
                <p id="modal-protein" class="text-lg font-bold text-blue-600">${Math.round(baseProtein)}g</p>
                <p class="text-[11px] text-gray-500 font-medium">Protein</p>
              </div>
              <div>
                <p id="modal-carbs" class="text-lg font-bold text-amber-600">${Math.round(baseCarbs)}g</p>
                <p class="text-[11px] text-gray-500 font-medium">Carbs</p>
              </div>
              <div>
                <p id="modal-fat" class="text-lg font-bold text-purple-600">${Math.round(baseFat)}g</p>
                <p class="text-[11px] text-gray-500 font-medium">Fat</p>
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `<i class="fa-solid fa-calculator mr-2"></i> Log Meal`,
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl p-6 max-w-md w-full",
        confirmButton: "px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer ml-3",
        cancelButton: "px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-all cursor-pointer"
      },
      didOpen: () => {
        const inputServings = document.getElementById("input-servings");
        const btnDec = document.getElementById("btn-dec-servings");
        const btnInc = document.getElementById("btn-inc-servings");

        const modalCal = document.getElementById("modal-calories");
        const modalPro = document.getElementById("modal-protein");
        const modalCarb = document.getElementById("modal-carbs");
        const modalFat = document.getElementById("modal-fat");

        function updateModalNutrition() {
          modalCal.textContent = Math.round(baseCalories * servings);
          modalPro.textContent = Math.round(baseProtein * servings) + "g";
          modalCarb.textContent = Math.round(baseCarbs * servings) + "g";
          modalFat.textContent = Math.round(baseFat * servings) + "g";
        }

        btnDec.onclick = () => {
          if (servings > 1) {
            servings--;
            inputServings.value = servings;
            updateModalNutrition();
          }
        };

        btnInc.onclick = () => {
          servings++;
          inputServings.value = servings;
          updateModalNutrition();
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        let item = {
          type: "meal",
          id: getMealId(meal),
          name: getMealName(meal),
          image: getMealImage(meal),
          calories: baseCalories * servings,
          protein: baseProtein * servings,
          carbs: baseCarbs * servings,
          fat: baseFat * servings,
          servings: servings,
          date: new Date().toISOString().split("T")[0]
        };

        addFoodLogItem(item);

        Swal.fire({
          icon: "success",
          title: "Logged Successfully!",
          text: `${item.name} (${servings} serving${servings > 1 ? "s" : ""}) added to your Food Log.`,
          confirmButtonText: "OK",
          confirmButtonColor: "#10b981"
        });

        goToPage("foodlog");
        updateFoodLog();
      }
    });
  };
}

function addFoodLogItem(item) {
  let items = JSON.parse(localStorage.getItem("nutriplan-foodlog") || "[]");

  items.push(item);

  localStorage.setItem("nutriplan-foodlog", JSON.stringify(items));
}

function getFoodLogItems() {
  return JSON.parse(localStorage.getItem("nutriplan-foodlog") || "[]");
}

function clearFoodLog() {
  Swal.fire({
    title: "Clear Today's Log?",
    text: "This will remove all logged food items for today.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, clear it!",
    cancelButtonText: "Cancel",
    buttonsStyling: false,
    customClass: {
      popup: "rounded-3xl p-6 max-w-md w-full text-center",
      icon: "border-0 my-3 text-amber-500",
      title: "text-2xl font-bold text-gray-900 mb-2",
      htmlContainer: "text-sm text-gray-500 mb-6",
      actions: "flex items-center justify-center gap-3 w-full mt-2",
      confirmButton: "px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-xs inline-block",
      cancelButton: "px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-black font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-xs inline-block"
    }
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("nutriplan-foodlog");
      updateFoodLog();

      Swal.fire({
        title: "Cleared!",
        text: "Your food log has been cleared.",
        icon: "success",
        showConfirmButton: false,
        timer: 1800,
        customClass: {
          popup: "rounded-3xl p-8 max-w-md w-full text-center shadow-2xl",
          icon: "border-0 my-2 text-emerald-500",
          title: "text-2xl font-bold text-gray-800 mb-2",
          htmlContainer: "text-sm text-gray-500"
        }
      });
    }
  });
}

function updateFoodLog() {
  let items = getFoodLogItems();

  let today = new Date().toISOString().split("T")[0];

  items = items.filter(function (item) {
    return item.date === today;
  });

  let calories = items.reduce(function (sum, item) {
    return sum + Number(item.calories || 0);
  }, 0);

  let protein = items.reduce(function (sum, item) {
    return sum + Number(item.protein || 0);
  }, 0);

  let carbs = items.reduce(function (sum, item) {
    return sum + Number(item.carbs || 0);
  }, 0);

  let fat = items.reduce(function (sum, item) {
    return sum + Number(item.fat || 0);
  }, 0);

  updateProgressBars(calories, protein, carbs, fat);
  updateLoggedItems(items);
}

function updateProgressBars(calories, protein, carbs, fat) {
  let caloriesText = document.querySelector(
    "#foodlog-today-section .bg-emerald-50 span.text-sm.text-gray-500"
  );

  if (caloriesText) {
    caloriesText.textContent = `${Math.round(calories)} / 2000 kcal`;
  }

  let proteinText = document.querySelector(
    "#foodlog-today-section .bg-blue-50 span.text-sm.text-gray-500"
  );

  if (proteinText) {
    proteinText.textContent = `${Math.round(protein)} / 50 g`;
  }

  let carbsText = document.querySelector(
    "#foodlog-today-section .bg-amber-50 span.text-sm.text-gray-500"
  );

  if (carbsText) {
    carbsText.textContent = `${Math.round(carbs)} / 250 g`;
  }

  let fatText = document.querySelector(
    "#foodlog-today-section .bg-purple-50 span.text-sm.text-gray-500"
  );

  if (fatText) {
    fatText.textContent = `${Math.round(fat)} / 65 g`;
  }

  let bars = document.querySelectorAll(
    "#foodlog-today-section .w-full.bg-gray-200 > div"
  );

  if (bars.length >= 4) {
    bars[0].style.width = Math.min((calories / 2000) * 100, 100) + "%";
    bars[1].style.width = Math.min((protein / 50) * 100, 100) + "%";
    bars[2].style.width = Math.min((carbs / 250) * 100, 100) + "%";
    bars[3].style.width = Math.min((fat / 65) * 100, 100) + "%";
  }
}

function updateLoggedItems(items) {
  let container = document.getElementById("logged-items-list");

  if (!container) return;

  let title = document.querySelector("#foodlog-today-section h4");
  if (title) {
    title.textContent = `Logged Items (${items.length})`;
  }

  let clearButton = document.getElementById("clear-foodlog");
  if (clearButton) {
    clearButton.style.display = items.length ? "block" : "none";
  }

  if (!items.length) {
    container.innerHTML = `
      <div class="py-10 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <i class="fa-solid fa-utensils text-2xl text-gray-300"></i>
        </div>
        <h3 class="text-base font-bold text-gray-800 mb-1">No food logged today</h3>
        <p class="text-xs text-gray-400 mb-6">Start tracking your nutrition by logging meals or scanning products</p>

        <div class="flex items-center gap-3">
          <button
            id="empty-browse-recipes-btn"
            class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <i class="fa-solid fa-plus text-xs"></i>
            Browse Recipes
          </button>

          <button
            id="empty-scan-product-btn"
            class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <i class="fa-solid fa-barcode text-xs"></i>
            Scan Product
          </button>
        </div>
      </div>
    `;

    document.getElementById("empty-browse-recipes-btn")?.addEventListener("click", function () {
      goToPage("meals");
    });

    document.getElementById("empty-scan-product-btn")?.addEventListener("click", function () {
      goToPage("products");
    });

    return;
  }

  container.innerHTML = "";

  items.forEach(function (item) {
    container.innerHTML += `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
        <div class="flex items-center gap-3">
          <img
            src="${item.image || "https://via.placeholder.com/60"}"
            class="w-12 h-12 rounded-lg object-cover"
            alt="${item.name}"
          />
          <div>
            <p class="font-semibold text-gray-900">${item.name}</p>
            <p class="text-xs text-gray-500">${Math.round(item.calories || 0)} kcal</p>
          </div>
        </div>

        <div class="text-right text-xs text-gray-500">
          <p>${Math.round(item.protein || 0)}g protein</p>
          <p>${Math.round(item.carbs || 0)}g carbs</p>
          <p>${Math.round(item.fat || 0)}g fat</p>
        </div>
      </div>
    `;
  });
}

function loadCuisines() {
  let url = mealsApi + "/list.php?a=list";

  getMeals(url, function (data) {
    let filterContainer = document.querySelector("#search-filters-section .flex.items-center.gap-3");

    if (!filterContainer) return;

    let html = `
      <button
        class="cuisine-btn px-4 py-2 bg-emerald-600 text-white rounded-full font-medium text-sm whitespace-nowrap hover:bg-emerald-700 transition-all cursor-pointer"
        data-area=""
      >
        All Cuisines
      </button>
    `;

    if (data && data.length > 0) {
      data.forEach(function (item) {
        html += `
          <button
            class="cuisine-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition-all cursor-pointer"
            data-area="${item.strArea}"
          >
            ${item.strArea}
          </button>
        `;
      });
    }

    filterContainer.innerHTML = html;

    document.querySelectorAll(".cuisine-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".cuisine-btn").forEach(function (b) {
          b.className = "cuisine-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition-all cursor-pointer";
        });

        btn.className = "cuisine-btn px-4 py-2 bg-emerald-600 text-white rounded-full font-medium text-sm whitespace-nowrap hover:bg-emerald-700 transition-all cursor-pointer";

        currentArea = btn.getAttribute("data-area");
        currentCategory = "";
        currentSearch = "";

        let searchInputEl = document.getElementById("search-input");
        if (searchInputEl) searchInputEl.value = "";

        loadRecipes();
      });
    });
  });
}

function createCategories() {
  let container = document.getElementById("categories-grid");

  if (!container) return;

  let categoriesConfig = [
    { name: "Beef", icon: "fa-drumstick-bite", bg: "#fef2f2", border: "#fecaca", iconBg: "#ef4444" },
    { name: "Chicken", icon: "fa-drumstick-bite", bg: "#fffbeb", border: "#fde68a", iconBg: "#f59e0b" },
    { name: "Dessert", icon: "fa-cake-candles", bg: "#fdf2f8", border: "#fbcfe8", iconBg: "#ec4899" },
    { name: "Lamb", icon: "fa-bone", bg: "#fff7ed", border: "#ffedd5", iconBg: "#f97316" },
    { name: "Miscellaneous", icon: "fa-utensils", bg: "#f8fafc", border: "#e2e8f0", iconBg: "#64748b" },
    { name: "Pasta", icon: "fa-bowl-food", bg: "#fefce8", border: "#fef08a", iconBg: "#eab308" },
    { name: "Pork", icon: "fa-drumstick-bite", bg: "#fff1f2", border: "#fecdd3", iconBg: "#f43f5e" },
    { name: "Seafood", icon: "fa-fish", bg: "#f0f9ff", border: "#bae6fd", iconBg: "#0ea5e9" },
    { name: "Side", icon: "fa-bowl-food", bg: "#ecfdf5", border: "#a7f3d0", iconBg: "#10b981" },
    { name: "Starter", icon: "fa-utensils", bg: "#ecfeff", border: "#a5f3fc", iconBg: "#06b6d4" },
    { name: "Vegan", icon: "fa-seedling", bg: "#f0fdf4", border: "#bbf7d0", iconBg: "#22c55e" },
    { name: "Vegetarian", icon: "fa-leaf", bg: "#f7fee7", border: "#d9f99d", iconBg: "#84cc16" }
  ];

  let html = "";

  for (let i = 0; i < categoriesConfig.length; i++) {
    let cat = categoriesConfig[i];

    html += `
      <div
        class="category-card rounded-xl p-3 border cursor-pointer transition-all hover:shadow-md group"
        style="background-color: ${cat.bg}; border-color: ${cat.border};"
        data-category="${cat.name}"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="text-white w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
            style="background-color: ${cat.iconBg};"
          >
            <i class="fa-solid ${cat.icon}"></i>
          </div>

          <div>
            <h3 class="text-sm font-bold text-gray-900">
              ${cat.name}
            </h3>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  document.querySelectorAll(".category-card").forEach(function (card) {
    card.addEventListener("click", function () {
      currentCategory = card.getAttribute("data-category");
      currentArea = "";
      currentSearch = "";

      let searchInputEl = document.getElementById("search-input");

      if (searchInputEl) {
        searchInputEl.value = "";
      }

      loadRecipes();

      document.getElementById("all-recipes-section").scrollIntoView({
        behavior: "smooth"
      });
    });
  });
}

let searchInput = document.getElementById("search-input");

if (searchInput) {
  searchInput.addEventListener("input", function () {
    currentSearch = searchInput.value.trim();
    currentCategory = "";
    currentArea = "";
    loadRecipes();
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      currentSearch = searchInput.value.trim();
      currentCategory = "";
      currentArea = "";
      loadRecipes();
    }
  });
}


let currentProducts = [];
let currentNutriGrade = "";

function getGradeColor(grade) {
  const colors = {
    a: "bg-green-500",
    b: "bg-lime-500",
    c: "bg-yellow-500",
    d: "bg-orange-500",
    e: "bg-red-500"
  };
  return colors[grade] || "bg-gray-400";
}

function searchProductsByName(query) {
  let grid = document.getElementById("products-grid");

  if (!grid || !query) return;

  grid.innerHTML = `
    <div class="col-span-full text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-emerald-600"></i>
      <p class="mt-3 text-gray-500">Searching products...</p>
    </div>
  `;

  fetch(
    "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" +
    encodeURIComponent(query) +
    "&search_simple=1&action=process&json=1&page_size=50" +
    "&fields=code,product_name,brands,image_front_url,image_front_small_url,image_url,nutriments,nutriscore_grade,nova_group,quantity"
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      let allProducts = data.products || [];
      let q = query.trim().toLowerCase();

      let matched = allProducts.filter(function (p) {
        let name = (p.product_name || "").toLowerCase();
        let brand = (p.brands || "").toLowerCase();
        return name.includes(q) || brand.includes(q);
      });

      let countLabel = document.getElementById("products-count");
      if (countLabel) {
        countLabel.textContent = `Found ${matched.length} products for "${query}"`;
      }
      displayProducts(matched);
    })
    .catch(function () {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 text-red-500">
          Unable to load products
        </div>
      `;
    });
}

function searchProductByBarcode(barcode) {
  fetch(productsApi + "/product/" + encodeURIComponent(barcode) + ".json")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      let countLabel = document.getElementById("products-count");

      if (data.status === 1 && data.product) {
        if (countLabel) countLabel.textContent = `Found 1 product for barcode "${barcode}"`;
        displayProducts([data.product]);
      } else {
        if (countLabel) countLabel.textContent = `No product found for barcode "${barcode}"`;
        displayProducts([]);
      }
    })
    .catch(function () {
      displayProducts([]);
    });
}

function displayProducts(productsList) {
  let grid = document.getElementById("products-grid");

  if (!grid) return;

  currentProducts = productsList || [];

  let filtered = currentProducts;

  if (currentNutriGrade) {
    filtered = currentProducts.filter(function (p) {
      let g = (p.nutriscore_grade || p.nutrition_grades || "").toLowerCase();
      return g === currentNutriGrade;
    });
  }

  if (!filtered || filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16 flex flex-col items-center justify-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <i class="fa-solid fa-box-open text-2xl text-gray-400"></i>
        </div>
        <p class="text-sm font-medium text-gray-500">No products to display</p>
      </div>
    `;
    return;
  }

  let html = "";

  for (let i = 0; i < filtered.length; i++) {
    let p = filtered[i];

    let name = p.product_name || "Unknown Product";
    let brand = p.brands ? p.brands.split(",")[0].trim() : "Unknown";
    let img =
      p.image_front_url ||
      p.image_front_small_url ||
      p.image_url ||
      "https://via.placeholder.com/300x300?text=No+Image";
    let grade = (p.nutriscore_grade || p.nutrition_grades || "").toLowerCase();
    let gradeLabel = grade ? grade.toUpperCase() : "";
    let nova = p.nova_group || null;
    let quantity = p.quantity || "N/A";

    let n = p.nutriments || {};
    let kcal = Math.round(n["energy-kcal_100g"] || 0);
    let protein = (n.proteins_100g || 0).toFixed(1);
    let carbs = (n.carbohydrates_100g || 0).toFixed(1);
    let fat = (n.fat_100g || 0).toFixed(1);
    let sugar = (n.sugars_100g || 0).toFixed(1);

    html += `
      <div
        class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
        data-barcode="${p.code || ""}"
      >
        <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img
            class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
            src="${img}" alt="${name}" loading="lazy"
          />

          ${grade ? `
          <div class="absolute top-2 left-2 ${getGradeColor(grade)} text-white text-xs font-bold px-2 py-1 rounded uppercase">
            Nutri-Score ${gradeLabel}
          </div>` : ""}

          ${nova ? `
          <div class="absolute top-2 right-2 bg-lime-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" title="NOVA ${nova}">
            ${nova}
          </div>` : ""}
        </div>

        <div class="p-4">
          <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${brand}</p>
          <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${name}</h3>

          <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span><i class="fa-solid fa-weight-scale mr-1"></i>${quantity}</span>
            <span><i class="fa-solid fa-fire mr-1"></i>${kcal} kcal/100g</span>
          </div>

          <div class="grid grid-cols-4 gap-1 text-center mb-3">
            <div class="bg-emerald-50 rounded p-1.5">
              <p class="text-xs font-bold text-emerald-700">${protein}g</p>
              <p class="text-[10px] text-gray-500">Protein</p>
            </div>
            <div class="bg-blue-50 rounded p-1.5">
              <p class="text-xs font-bold text-blue-700">${carbs}g</p>
              <p class="text-[10px] text-gray-500">Carbs</p>
            </div>
            <div class="bg-purple-50 rounded p-1.5">
              <p class="text-xs font-bold text-purple-700">${fat}g</p>
              <p class="text-[10px] text-gray-500">Fat</p>
            </div>
            <div class="bg-orange-50 rounded p-1.5">
              <p class="text-xs font-bold text-orange-700">${sugar}g</p>
              <p class="text-[10px] text-gray-500">Sugar</p>
            </div>
          </div>

          <button class="add-product-log-btn w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all">
            <i class="fa-solid fa-plus mr-1"></i>Log this product
          </button>
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;

  document.querySelectorAll(".add-product-log-btn").forEach(function (btn, index) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      addProductToFoodLog(filtered[index]);
    });
  });
}

function addProductToFoodLog(product) {
  let nutrition = product.nutriments || {};

  let item = {
    type: "product",
    id: product.code || Date.now(),
    name: product.product_name || "Product",
    image: product.image_front_url || "https://via.placeholder.com/60",
    calories: Number(
      nutrition["energy-kcal_100g"] ||
      nutrition["energy-kcal"] ||
      0
    ),
    protein: Number(nutrition.proteins_100g || 0),
    carbs: Number(nutrition.carbohydrates_100g || 0),
    fat: Number(nutrition.fat_100g || 0),
    date: new Date().toISOString().split("T")[0]
  };

  addFoodLogItem(item);
  updateFoodLog();

  Swal.fire({
    icon: "success",
    title: "Logged Successfully!",
    text: `${item.name} has been added to your Food Log.`,
    confirmButtonText: "OK",
    confirmButtonColor: "#10b981"
  });

  goToPage("foodlog");
}

let productSearchInput = document.getElementById("product-search-input");
let searchProductButton = document.getElementById("search-product-btn");
let barcodeInput = document.getElementById("barcode-input");
let barcodeButton = document.getElementById("lookup-barcode-btn");
let nutriScoreFilters = document.querySelectorAll(".nutri-score-filter");
let productCategoryBtns = document.querySelectorAll(".product-category-btn");

if (searchProductButton) {
  searchProductButton.addEventListener("click", function () {
    searchProductsByName(
      productSearchInput ? productSearchInput.value.trim() : ""
    );
  });
}

if (productSearchInput) {
  productSearchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      searchProductsByName(productSearchInput.value.trim());
    }
  });
}

if (barcodeButton) {
  barcodeButton.addEventListener("click", function () {
    let barcode = barcodeInput ? barcodeInput.value.trim() : "";

    if (barcode) {
      searchProductByBarcode(barcode);
    }
  });
}

if (barcodeInput) {
  barcodeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      let barcode = barcodeInput.value.trim();

      if (barcode) {
        searchProductByBarcode(barcode);
      }
    }
  });
}

nutriScoreFilters.forEach(function (btn) {
  btn.addEventListener("click", function () {
    currentNutriGrade = btn.dataset.grade || "";

    nutriScoreFilters.forEach(function (b) {
      b.classList.remove("bg-emerald-600", "text-white");
    });

    btn.classList.add("bg-emerald-600", "text-white");

    displayProducts(currentProducts);
  });
});

productCategoryBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    let categoryName = btn.textContent.trim();

    if (productSearchInput) {
      productSearchInput.value = categoryName;
    }

    searchProductsByName(categoryName);
  });
});

let backButton = document.getElementById("back-to-meals-btn");

if (backButton) {
  backButton.addEventListener("click", function () {
    goToPage("meals");
  });
}

let clearFoodLogButton = document.getElementById("clear-foodlog");

if (clearFoodLogButton) {
  clearFoodLogButton.addEventListener("click", function () {
    clearFoodLog();
  });
}

loadCuisines();
createCategories();
loadRecipes();
updateFoodLog();

function setupQuickLogCards() {
  let elements = document.querySelectorAll(".quick-log-btn, [data-page='foodlog'] .grid > div");

  elements.forEach(function (el) {
    el.style.cursor = "pointer";
    el.addEventListener("click", function () {
      let text = el.textContent.toLowerCase();

      if (text.includes("meal") || text.includes("recipe")) {
        goToPage("meals");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (text.includes("scan") || text.includes("product")) {
        goToPage("products");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

setupQuickLogCards();