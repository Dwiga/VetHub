Rails.application.routes.draw do
  devise_for :users

  # Redirect to localhost from 127.0.0.1 to use same IP address with Vite server
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req| "#{req.protocol}localhost:#{req.port}/#{params[:path]}" }
  end

  root "home#index"
  get "home", to: "home#index"

  resources :owner, only: [ :index ] do
    resources :pet, only: [ :create, :update ] do
      get :details
      resources :monitoring do
        post :create
      end
    end
  end

  resources :species, only: [ :index ]

  resources :vet, only: [ :index, :new, :create ] do
    get :employees
    collection do
      get :lookup
    end
  end

  scope "/vet/patients", as: :vet_patients do
    post "pets", to: "vet_patients#create_pet", as: :create_pet
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
end
