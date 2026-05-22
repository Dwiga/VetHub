class PetController < InertiaController
  before_action :authenticate_user!

  def create
    @pet = Pet.new(pet_params)
    @pet.user = current_user
    @pet.owner_phone = current_user.phone_number

    if @pet.save
      redirect_back(fallback_location: "/owner", notice: "Pet successfully created")
    else
      redirect_back(fallback_location: "/owner", alert: @pet.errors.full_messages.join(", "))
    end
  end

  def update
    @pet = Pet.find_by(user_id: current_user.id, id: params[:id])
    if @pet.update(pet_params)
      redirect_back(fallback_location: details_owner_pet_path(owner_id: @pet.user_id, id: @pet.id), notice: 'Pet updated successfully.')
    else
      redirect_back(fallback_location: details_owner_pet_path(owner_id: @pet.user_id, id: @pet.id), alert: @pet.errors.full_messages.join(', '))
    end
  end

  def details
    @pet = Pet.find_by(user_id: current_user.id, id: params[:pet_id])
    @weights = Monitoring.where(pet_id: @pet.id, type: :weight).where.not(data: nil).order(created_at: :desc).limit(10).reverse_order.map { |m| { date: m.created_at.strftime('%Y-%m-%d'), value: m.data } }
    @temperatures = Monitoring.where(pet_id: @pet.id, type: :temperature).where.not(data: nil).order(created_at: :desc).limit(10).reverse_order.map { |m| { date: m.created_at.strftime('%Y-%m-%d'), value: m.data } }
    @monitor = Monitoring.types.map { |label, type| { label: label, value: type } }
    @species = Species.all.map { |s| { label: s.name, value: s.id } }
    render inertia: { pet: @pet, weights: @weights, temperatures: @temperatures, monitor: @monitor, species: @species }
  end

  private

  def pet_params
    params.require(:pet).permit(:name, :species_id, :birth_date, :gender, :color, :sterilized)
  end
end
