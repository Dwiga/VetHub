class SpeciesController < InertiaController
  def index
    @species = Species.all
    render json: @species
  end
end
