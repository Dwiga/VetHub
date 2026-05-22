class VetPatientsController < InertiaController
  before_action :authenticate_user!
  before_action :require_vet_role

  def create_pet
    phone = PhoneNumber.normalize(params[:owner_phone])

    if phone.blank?
      redirect_to lookup_vet_index_path, alert: "Phone number required"
      return
    end

    @pet = Pet.new(pet_params)
    @pet.owner_phone = phone

    if @pet.save
      redirect_to lookup_vet_index_path(phone: phone), notice: "Pet added"
    else
      redirect_to lookup_vet_index_path(phone: phone), alert: @pet.errors.full_messages.join(", ")
    end
  end

  private

  def pet_params
    params.require(:pet).permit(:name, :species_id, :birth_date, :gender, :color, :sterilized, :weight, :temperature)
  end

  def require_vet_role
    unless current_user.vet.present? && current_user.vet_role.present?
      redirect_to vet_index_path, alert: "Vet role required"
    end
  end
end
